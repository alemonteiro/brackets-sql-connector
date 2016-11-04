CREATE TABLE [{{name}}] AS (
{{#fields}}
	[{{name}}] {{type}} {{^allowNull}}NOT NULL{{/allowNull}} {{#primaryKey}}PRIMARY KEY{{/primaryKey}} {{#autoIncrement}}IDENTITY(1,1){{/autoIncrement}},
{{/fields}}
);
