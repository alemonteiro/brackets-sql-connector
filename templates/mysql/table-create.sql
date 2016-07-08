CREATE TABLE `{{name}}` AS (
{{#fields}}
	{{name}} {{type}} {{^allow_null}}NOT NULL{{/allow_null}} {{#pk}}PRIMARY KEY{{/pk}} {{#ai}}AUTO_INCREMENT{{/ai}},
{{/fields}}
);
