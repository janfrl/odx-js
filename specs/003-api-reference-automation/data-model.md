# Data Model: API Reference JSON

This feature produces a flat JSON artifact that represents the public API of the ODX project.

## Schema Definition

The generated JSON is a dictionary where each key is the name of an exported symbol, and the value is an `ApiItem`.

### `ApiItem`
Represents an exported interface, type alias, or function.

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | The name of the symbol (e.g., `ODataClientConfig`). |
| `description` | `string?` | The top-level JSDoc comment for the symbol. |
| `properties` | `ApiProperty[]` | List of members (for interfaces/types) or parameters (for functions). |

### `ApiProperty`
Represents a single property of an interface/type or a parameter of a function.

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | The name of the property or parameter. |
| `type` | `string` | The TypeScript type as a string (e.g., `string | number`). |
| `default` | `string?` | The default value, extracted from `@default` JSDoc tag or initializer. |
| `description` | `string?` | The JSDoc comment for this specific property. |
| `required` | `boolean` | Whether the property/parameter is mandatory. |

## Example Output

```json
{
  "ODataClientConfig": {
    "title": "ODataClientConfig",
    "description": "Configuration for the OData client.",
    "properties": [
      {
        "name": "baseURL",
        "type": "string",
        "description": "The base URL for the OData service.",
        "required": true
      },
      {
        "name": "timeout",
        "type": "number",
        "default": "10000",
        "description": "Request timeout in milliseconds.",
        "required": false
      }
    ]
  }
}
```

## Relationships
- **Flat Structure**: There are no explicit relationships in the JSON. If a property's type refers to another `ApiItem`, the documentation site is responsible for linking them if desired.
