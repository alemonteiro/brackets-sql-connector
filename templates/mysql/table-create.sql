CREATE TABLE `{{name}}` AS (
{{#fields}}
	{{name}} {{type}} {{^allowNull}}NOT NULL{{/allowNull}} {{#primaryKey}}PRIMARY KEY{{/primaryKey}} {{#autoIncrement}}AUTO_INCREMENT{{/autoIncrement}},
{{/fields}}
);
