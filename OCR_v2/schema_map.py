import os
import json
from typing import Dict, Type, Any, Optional, List
from pydantic import BaseModel, Field, create_model

TYPE_MAPPING = {
    "str": str,
    "int": int,
    "float": float,
    "bool": bool
}

class DynamicSchemaRegistry:
    def __init__(self, profile_path: str = None):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.profile_path = profile_path or os.path.join(current_dir, "document_profiles.json")
        self.schema_map: Dict[str, Type[BaseModel]] = {}
        self.raw_profiles: Dict[str, Any] = {}
        self._load_and_compile()

    def _load_and_compile(self):
        if not os.path.exists(self.profile_path):
            raise FileNotFoundError(f"Missing master document profile definition asset at: {self.profile_path}")
            
        with open(self.profile_path, "r") as f:
            self.raw_profiles = json.load(f)

        for doc_type, config in self.raw_profiles.items():
            class_name = "".join(word.capitalize() for word in doc_type.split("_"))
            self.schema_map[doc_type] = self._build_model(class_name, config.get("fields", {}))

    def _camelize(self, value: str) -> str:
        return "".join(part.capitalize() for part in value.split("_"))

    def _compile_field(self, field_name: str, field_info: Dict[str, Any], parent_class_name: str):
        raw_type = field_info.get("type", "str")
        description = field_info.get("description", "")

        if raw_type in TYPE_MAPPING:
            python_type = TYPE_MAPPING[raw_type]
            return (
                Optional[python_type],
                Field(default=None, description=description),
            )

        if raw_type == "object":
            nested_fields = field_info.get("fields", {})
            if not isinstance(nested_fields, dict):
                raise ValueError(f"Object field '{field_name}' must define a 'fields' mapping.")
            nested_name = f"{parent_class_name}{self._camelize(field_name)}"
            nested_model = self._build_model(nested_name, nested_fields)
            return (
                Optional[nested_model],
                Field(default=None, description=description),
            )

        if raw_type == "list":
            item_info = field_info.get("items")
            if not isinstance(item_info, dict):
                raise ValueError(f"List field '{field_name}' must define an 'items' schema.")
            item_type = self._compile_list_item_type(f"{parent_class_name}{self._camelize(field_name)}Item", item_info)
            return (
                List[item_type],
                Field(default_factory=list, description=description),
            )

        raise ValueError(f"Unsupported field type '{raw_type}' for '{field_name}'.")

    def _compile_list_item_type(self, class_name: str, item_info: Dict[str, Any]):
        raw_type = item_info.get("type", "str")

        if raw_type in TYPE_MAPPING:
            return TYPE_MAPPING[raw_type]

        if raw_type == "object":
            nested_fields = item_info.get("fields", {})
            if not isinstance(nested_fields, dict):
                raise ValueError(f"List item object '{class_name}' must define a 'fields' mapping.")
            return self._build_model(class_name, nested_fields)

        if raw_type == "list":
            nested_items = item_info.get("items")
            if not isinstance(nested_items, dict):
                raise ValueError(f"Nested list item '{class_name}' must define an 'items' schema.")
            nested_type = self._compile_list_item_type(f"{class_name}Item", nested_items)
            return List[nested_type]

        raise ValueError(f"Unsupported list item type '{raw_type}' in '{class_name}'.")

    def _build_model(self, class_name: str, fields_config: Dict[str, Any]):
        fields_definition: Dict[str, Any] = {}

        for field_name, field_info in fields_config.items():
            if not isinstance(field_info, dict):
                raise ValueError(f"Field '{field_name}' must be described by a mapping.")
            fields_definition[field_name] = self._compile_field(field_name, field_info, class_name)

        return create_model(
            class_name,
            __base__=BaseModel,
            **fields_definition,
        )

# Singular global instance instantiation for app lifecycle
REGISTRY = DynamicSchemaRegistry()
SCHEMA_MAP = REGISTRY.schema_map
RAW_PROFILES = REGISTRY.raw_profiles