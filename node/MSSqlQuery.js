/*jshint node: true*/
module.exports = {
	
	showTables: function(db) {
		return "SELECT TABLE_NAME as [Table], TABLE_TYPE as [Type], TABLE_SCHEMA as [Schema], TABLE_CATALOG as [Catalog] FROM information_schema.tables";
	},
	
	showFields: function(db, table) {
		return ('SELECT ' +
					"c.name as [Field], " +
					"t.Name [Type], " +
					"c.max_length [Length],  " +
					"c.precision ,  " +
					"c.scale ,  " +
					"c.is_nullable,  " +
					"[Key] = CASE WHEN ISNULL(i.is_primary_key, 0) = 0 THEN '' ELSE 'PRI' END " +
				"FROM   " +  
					"sys.columns c " +
						"INNER JOIN  sys.types t  " +
								"ON c.user_type_id = t.user_type_id " +
						"LEFT OUTER JOIN sys.index_columns ic " +
								"ON ic.object_id = c.object_id AND ic.column_id = c.column_id " +
						"LEFT OUTER JOIN sys.indexes i  " +
								"ON ic.object_id = i.object_id AND ic.index_id = i.index_id " +
				"WHERE " +
					 " +c.object_id = OBJECT_ID('"+table+"') ");
	},
	
	showForeignKeys: function(db, table) {
		return ( 'SELECT ' +
    				'[ReferencedTable] = FK.TABLE_NAME, ' +
    				'[ReferencedField] = CU.COLUMN_NAME, ' +
					'[Table] = PK.TABLE_NAME, ' +
					'[Field] = PT.COLUMN_NAME, ' +
    				'Constraint_Name = C.CONSTRAINT_NAME ' +
				'FROM ' +
    				'INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS C ' +
						'INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS FK ' +
    						'ON C.CONSTRAINT_NAME = FK.CONSTRAINT_NAME ' +
						'INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS PK ' +
    						'ON C.UNIQUE_CONSTRAINT_NAME = PK.CONSTRAINT_NAME ' +
						'INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE CU ' +
    						'ON C.CONSTRAINT_NAME = CU.CONSTRAINT_NAME ' +
						'INNER JOIN ( ' +
							'SELECT ' +
								'i1.TABLE_NAME, ' +
								'i2.COLUMN_NAME ' +
							'FROM ' +
								'INFORMATION_SCHEMA.TABLE_CONSTRAINTS i1 ' +
							'INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE i2 ' +
								'ON i1.CONSTRAINT_NAME = i2.CONSTRAINT_NAME ' +
							'WHERE ' +
								"i1.CONSTRAINT_TYPE = 'PRIMARY KEY' " +
						   ') PT ' +
					'ON PT.TABLE_NAME = PK.TABLE_NAME ' +
		   		"WHERE  C.CONSTRAINT_CATALOG = '"+db+"'"  +
				(typeof table === 'string' ? " AND PK.TABLE_NAME = '"+table+"' " : '' ) + ";");
	},
	
	showViews: function(db) {
		return ("select " +
					"[Name] = TABLE_NAME, " +
					"[Definition] = VIEW_DEFINITION, " +
					"[Catalog] = TABLE_CATALOG,  " +
					"[Schema] = TABLE_SCHEMA " +
				"FROM " + db + ".information_schema.views");
	},
	
	showRoutines: function(db, type) {
		return ( 'select ' +
					'[Name] = ROUTINE_NAME, '+
					'[Definition] = ROUTINE_DEFINITION, '+
					'[Catalog] = SPECIFIC_CATALOG, '+
					'[Schema] = SPECIFIC_SCHEMA,  '+
					'[Created] = CREATED, '+
					'[LastAltered] = LAST_ALTERED, '+
					'[Type] = routine_type '+
			'FROM ' + db + '.information_schema.routines  '+
			'WHERE '+
			 	"routine_type = '" + type + "' " + 
			   "AND Left(Routine_Name, 3) NOT IN ('sp_', 'xp_', 'ms_')");
	},
	
	showFunctions: function(db, name) {
		return this.showRoutines(db, 'FUNCTION');
	},
	
	showProcedures: function(db, name) {
		return this.showRoutines(db, 'PROCEDURE');
	}
	
	
};