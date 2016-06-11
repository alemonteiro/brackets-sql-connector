/*jshint node: true, jquery: true*/
/* globals brackets, define, Mustache */

define(function (require, exports) {
    'use strict';

    // Get module dependencies.
    var Dialogs = brackets.getModule('widgets/Dialogs'),
        // Extension modules.
        Strings = require('modules/Strings'),
        dataStorage = require('modules/DataStorageManager'),
        dialogTemplate = require('text!../html/dialog-compare.html'),
        msgDialogTemplate = require('text!../html/dialog-message.html'),
        msgConfirmationTemplate = require('text!../html/dialog-confirmation.html'),

        // Variables.
        dialog,
		$dialog,
        servers = {
			loadTables: undefined, // function(serverId, callback)
			loadFields: undefined, // function(serverId, table_name, callback)
			left : {
				tables: [],
				fields: [],
				lacking: []
			},
			right : {
				tables: [],
				fields: [],
				lacking: []
			},
			different: [],
			idenicals: [],
			tables: [],
			fields: {},
			fields_comp: {},
			reset: function() {
				this.different =[];
				this.left.tables = [];
				this.left.fields = [];
				this.left.lacking = [];
				this.right.tables = [];
				this.right.fields = [];
				this.right.lacking = [];
			},
			setTables: function(side, tables) {
				var oside = side === 'left' ? 'right' : 'left';
				this[side].tables = tables;

				if ( this[oside].tables.length > 0 ) {
					this.compareTables();
				}
			},
			setFields: function(side, table, fields) {
				var oside = side === 'left' ? 'right' : 'left';
				this[side].fields[table] = fields;

				if ( this[oside].fields[table] !== undefined ) {
					this.compareFields(table);
				}
			},
			compareTables: function() {
				var li=0, llen = this.left.tables.length, lt,
					ri=0, rlen = this.right.tables.length, rt,
					tmp = [], full = [], i;

				while(li<llen) {
					lt = this.left.tables[li];
					full.push({
						name: lt.toLowerCase(),
						left: lt,
						right: false
					});
					tmp.push(lt.toLowerCase());
					if (this.right.tables.indexOf(lt) !== -1) {
						this.different.push(lt);
					}
					else {
						this.right.lacking.push(lt);
					}
					li++;
				}

				while(ri<rlen) {
					rt = this.right.tables[ri];
					i = tmp.indexOf(rt.toLowerCase());
					if ( i === -1 ) {
						full.push({
							name: rt.toLowerCase(),
							left: false,
							right: rt
						});
					}
					else {
						full[i].right = rt;
					}
					if (this.left.tables.indexOf(rt) === -1) {
						this.left.lacking.push(rt);
					}
					else if ( this.different.indexOf(rt) !== -1 ) {
						this.different.push(rt);
					}
					ri++;
				}

				this.tables = full.sort(function(a,b) {
					if ( a.name === b.name ) return 0;
					if ( a.name > b.name ) return 1;
					return -1;
				});
			},
			compareFields: function(table) {
				var li=0, llen = this.left.fields[table].length, lc,
					ri=0, rlen = this.right.fields[table].length, rc,
					tmp = [], full = [], i, diff = false;

				if ( llen !== rlen ) {
					diff = true;
				}
				else {
					while(li<llen) {
						lc = this.left.fields[table][li];
						full.push({
							name: lc.toLowerCase(),
							left: {
								name: lc.Field,
								type: lc.Type
							},
							right: false
						});
						li++;
					}

					while(ri<rlen) {
						rc = this.right.fields[table][ri];
						i = tmp.indexOf(rc.Field.toLowerCase());
						if ( i === -1 ) {
							full.push({
								name: rc.Field.toLowerCase(),
								left: false,
								right: {
									name: lc.Field,
									type: lc.Type
								}
							});
							diff = true;
						}
						else {
							full[i].right = {
								name: lc.Field,
								type: lc.Type
							};

							if ( full[i].right.name !== full[i].left.name ) {
								diff = true;
							}
						}
						ri++;
					}
				}

				if ( diff ) {
					$('.brackets-sql-connector-compare-form li[data-table="'+table+'"]', $dialog).addClass("not-match");
				}

				this.fields_comp[table] = full.sort(function(a,b) {
					if ( a.name === b.name ) return 0;
					if ( a.name > b.name ) return 1;
					return -1;
				});
			}
		};

    /**
     * Set each value of the preferences in dialog.
     */
    function setValues(values) {

    }

    /**
     * Initialize dialog values.
     */
    function init() {

    }

	function listTables() {
		if ( servers.tables.length === 0 ) return false;
		var html_left = '', html_right = '',
			i=0,il=servers.tables.length,t;

		for(;i<il;i++) {
			t = servers.tables[i];
			html_left += '<li data-table="'+t.name+'" class="'+(!t.left? "not-found" : "")+'"><label>'+t.name+'</labela></li>';
			html_right += '<li data-table="'+t.name+'" class="'+(!t.right? "not-found" : "")+'"><label>'+t.name+'</label></li>';
		}
		//console.log("listing " + tables.length + ' tablies on ' + side + ' side');
		$(".brackets-sql-connector-compare-form.left", $dialog).find('.panel').html(html_left);
		$(".brackets-sql-connector-compare-form.right", $dialog).find('.panel').html(html_right);

		var lfields = function(side, table) {
			return function(fields)	{
				servers.setFields('left', table, fields);
			};
		};

		/*
		for(;i<il;i++) {
			t = servers.tables[i];

			if ( t.left ) {
				servers.loadFields(servers.left.id, t.left, lfields('left', t.left));
			}

			if ( t.right ) {
				servers.loadFields(servers.right.id, t.right, lfields('right', t.right));
			}
		}*/
	}

    /**
     * Exposed method to show dialog.
     */
    exports.showDialog = function (opts) {
        var self = this,
            _defaults = {
                loadTables: undefined, // function(serverId, callback)
                loadFields: undefined, // function(serverId, table_name, callback)
            };

        // Compile dialog template.
        var cfg = dataStorage.getSettings(),
			htmlOpts = '';

		if ( cfg && cfg.servers ) {
			for(var s in cfg.servers) {
			if (cfg.servers[s].__connection_id <= 0 ) continue;
				htmlOpts += '<option value="'+cfg.servers[s].__id+'">' + cfg.servers[s].name + '</option>';
			}
		}
		servers.loadFields = opts.loadFields;
		servers.loadTables = opts.loadTables;

        var compiledTemplate = Mustache.render(dialogTemplate, {
            Strings: Strings
        });

        // Save dialog to variable.
        dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate, false);

        // Initialize dialog values.
        init();

        // manually handle ESC Key and buttons because of autoDismiss = false
		$dialog = $(dialog.getElement());
        var $slc = $dialog.find('select.input-server');
		$slc.html(htmlOpts);
		var getIds = function() {
			var ids = [];
			$slc.each(function() {
				var v = $(this).val();
				if (  v !== undefined && v > 0 ) {
					ids.push(v);
				}
			});
			return ids;
		};

		$(dialog.getElement())
            .off('keyup')
            .on('keyup', function (evt) {
                if (evt.keyCode === 27) {
                    dialog.close();
                }
            })
            .off('click', 'button')
            .on('click', 'button', function (evt) {
                var buttonId = $(this).data('button-id');
                if (buttonId === 'compare') {
					var ids = getIds();
					console.log('Select Ids: ' + ids.length);
					if ( ids.length === 2 ) {
						servers.left.id = ids[0];
						servers.left.obj = dataStorage.getServer(ids[0], cfg);
						servers.right.id = ids[1];
						servers.right.obj = dataStorage.getServer(ids[1], cfg);

						opts.loadTables(servers.left.obj, function(tables) {
							servers.setTables('left', tables);
							listTables();
						});
						opts.loadTables(servers.right.obj, function(tables) {
							servers.setTables('right', tables);
							listTables();
						});
					}
                } else {
                    dialog.close();
                }
            });
    };
});
