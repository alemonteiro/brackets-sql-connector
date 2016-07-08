CREATE TABLE [{{name}}] AS (
{{#fields}}
	[{{name}}] {{type}} {{^allow_null}}NOT NULL{{/allow_null}} {{#pk}}PRIMARY KEY{{/pk}} {{#ai}}IDENTITY(1,1){{/ai}},
{{/fields}}
);
