{{#seq_field}}CREATE SEQUENCE {{table_name_}}_{{field_name}}_seq;{{/seq_field}}
CREATE TABLE [{{name}}] AS (
{{#fields}}
	[{{name}}] {{type}} {{^allow_null}}NOT NULL{{/allow_null}} {{#pk}}PRIMARY KEY{{/pk}} {{#ai}}DEFAULT nextval('{{table_name_}}{{name}}_seq'){{/ai}},
{{/fields}}
);
{{#seq_field}}ALTER SEQUENCE {{table_name_}}_{{field_name}}_seq OWNED BY {{table_name}}.{{field_name}};{{/seq_field}}
