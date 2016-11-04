/*jshint node: true*/
module.exports = {

	showTables: function(db, allTables) {
		return ("SELECT TABLE_NAME as Table, TABLE_TYPE as Type, TABLE_SCHEMA as Schema, TABLE_CATALOG as Catalog " +
                "FROM information_schema.tables " + ( allTables === true ? "; " : " WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema'); "));
	},

	showFields: function(db, table) {
		return ('SELECT ' +
					"c.column_name as name, " +
					"c.data_type as type, " +
					"c.character_maximum_length as length,  " +
					"c.numeric_precision as precision ,  " +
					"c.is_nullable as allowNull,  " +
					"'' as Key " +
				"FROM   " +
					"information_schema.columns c " +
				"WHERE " +
					 " c.table_name = '"+table+"';");
	},

	showForeignKeys: function(db, table) {
		return (
            "SELECT " +
                "tc.constraint_name as Constraint_Name,  " +
                "tc.table_name as Table,  " +
                "kcu.column_name as Field,  " +
                "ccu.table_name AS ReferencedTable, " +
                "ccu.column_name AS ReferencedField  " +
            "FROM  " +
                "information_schema.table_constraints AS tc  " +
                "JOIN information_schema.key_column_usage AS kcu " +
                 " ON tc.constraint_name = kcu.constraint_name " +
                "JOIN information_schema.constraint_column_usage AS ccu " +
                  "ON ccu.constraint_name = tc.constraint_name " +
            "WHERE constraint_type = 'FOREIGN KEY' AND tc.table_name='"+table+"'");
	},

	showViews: function(db) {
		return ("select " +
					"TABLE_NAME as Name, " +
					"VIEW_DEFINITION as Definition, " +
					"TABLE_CATALOG as Catalog,  " +
					"TABLE_SCHEMA as Schema " +
				"FROM information_schema.views " +
                    " WHERE table_schema NOT IN ('pg_catalog', 'information_schema');");
	},

	showRoutines: function(db, type) {
		return ( 'select ' +
					'ROUTINE_NAME as Name, '+
					'ROUTINE_DEFINITION as Definition, '+
					'SPECIFIC_CATALOG as Catalog, '+
					'SPECIFIC_SCHEMA as Schema,  '+
					'CREATED as Created, '+
					'LAST_ALTERED as LastAltered, '+
					'routine_type as Type '+
			'FROM information_schema.routines  '+
			'WHERE '+
			 	"routine_type = '" + type + "' " +
			     "AND Left(Routine_Name, 3) NOT IN ('sp_', 'xp_', 'ms_') " +
                " AND SPECIFIC_SCHEMA NOT IN ('pg_catalog', 'information_schema');");
	},

	showFunctions: function(db, name) {
		return this.showRoutines(db, 'FUNCTION');
	},

	showProcedures: function(db, name) {
		return this.showRoutines(db, 'PROCEDURE');
	}

};
