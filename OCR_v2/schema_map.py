import os
import json
from typing import Dict, Type, Any, Optional
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
            fields_definition: Dict[str, Any] = {}
            
            for field_name, field_info in config.get("fields", {}).items():
                raw_type = field_info.get("type", "str")
                python_type = TYPE_MAPPING.get(raw_type, str)
                description = field_info.get("description", "")

                # Explicitly wrap all properties as Optional with a default value of None 
                # This prevents strict validation exceptions downstream on messy text inputs
                fields_definition[field_name] = (
                    Optional[python_type], 
                    Field(default=None, description=description)
                )

            # Construct Pydantic model class dynamically
            class_name = "".join(word.capitalize() for word in doc_type.split("_"))
            compiled_model = create_model(
                class_name,
                __base__=BaseModel,
                **fields_definition
            )
            
            self.schema_map[doc_type] = compiled_model

# Singular global instance instantiation for app lifecycle
REGISTRY = DynamicSchemaRegistry()
SCHEMA_MAP = REGISTRY.schema_map
RAW_PROFILES = REGISTRY.raw_profiles