{{#seq_field}}CREATE SEQUENCE {{table_name_}}_{{field_name}}_seq;{{/seq_field}}
CREATE TABLE [{{name}}] AS (
{{#fields}}
	[{{name}}] {{type}} {{^allowNull}}NOT NULL{{/allowNull}} {{#primaryKey}}PRIMARY KEY{{/primaryKey}} {{#autoIncrement}}DEFAULT nextval('{{table_name_}}{{name}}_seq'){{/autoIncrement}},
{{/fields}}
);
{{#seq_field}}ALTER SEQUENCE {{table_name_}}_{{field_name}}_seq OWNED BY {{table_name}}.{{field_name}};{{/seq_field}}
