// This extension was developed by :
// * Francisco Pina Martins https://github.com/StuntsPT
//
// Licence: GPLv3

const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;

// ProfileManager function
function ProfileManager(metadata)
{	
	//Stub file for testing:
    //this.file = metadata.path + "/stubs/power_profile";
    
    this.file = "/sys/class/drm/card0/device/power_profile";

	this._init();
}

// Prototype
ProfileManager.prototype =
{
	__proto__: PanelMenu.Button.prototype,
	
    	_init: function() 
    	{			
		PanelMenu.Button.prototype._init.call(this, St.Align.START);

		this.buttonText = new St.Label({text:_("(...)")});
		this.buttonText.set_style("text-align:center;");
		this.actor.add_actor(this.buttonText);
		this.buttonText.get_parent().add_style_class_name("panelButtonWidth");
			
		this._refresh();
	},
	
	_refresh: function()
	{    		
		let varFile = this.file;
		let tasksMenu = this.menu;
		let buttonText = this.buttonText;
        
        // Clear
        tasksMenu.removeAll();
    	
        // Sync
		if (GLib.file_test(this.file, GLib.FileTest.EXISTS))
		{
			let content = Shell.get_file_contents_utf8_sync(this.file);

            //TODO: Change message to plain english
            let message = "Current power profile: " + content;
			let item = new PopupMenu.PopupMenuItem(_(message));
			tasksMenu.addMenuItem(item);
					
                //TODO: Change text to icon.
			buttonText.set_text("(RPPM)");
		}
		else { global.logError("Radeon power profile manager : Error while reading file : " + varFile); }
		
		// Separator
		this.Separator = new PopupMenu.PopupSeparatorMenuItem();
		tasksMenu.addMenuItem(this.Separator);
		
		// Bottom section
		let bottomSection = new PopupMenu.PopupMenuSection();
		
        //Create power profile changing buttons: 
        let lowpowerbutton = new PopupMenu.PopupMenuItem(_("Set power profile to 'low'"));
        tasksMenu.addMenuItem(lowpowerbutton)
        let midpowerbutton = new PopupMenu.PopupMenuItem(_("Set power profile to 'mid'"));
        tasksMenu.addMenuItem(midpowerbutton)
        let highpowerbutton = new PopupMenu.PopupMenuItem(_("Set power profile to 'high'"));
        tasksMenu.addMenuItem(highpowerbutton)

        //Give the buttons an action:
        lowpowerbutton.connect('activate',function(){
            changeProfile("low",varFile);
        });
            
        midpowerbutton.connect('activate',function(){
            changeProfile("mid",varFile);
        });
        
        highpowerbutton.connect('activate',function(){
            changeProfile("high",varFile);
        });
	},
	
	enable: function()
	{
		// Main.panel.addToStatusArea('tasks', this);  // how to destroy that correctly?
		Main.panel._rightBox.insert_child_at_index(this.actor, 0);
		Main.panel._menus.addMenu(this.menu);
		
		// Refresh menu
		let fileM = Gio.file_new_for_path(this.file);
		this.monitor = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
		this.monitor.connect('changed', Lang.bind(this, this._refresh));
	},

	disable: function()
	{
		Main.panel._menus.removeMenu(this.menu);
		// Main.panel._statusArea['tasks'].destroy();
		Main.panel._rightBox.remove_actor(this.actor);
		this.monitor.cancel();
	}
}


// Change power profile "text" in sysfs file "file"
function changeProfile(text,file)
{
	if (GLib.file_test(file, GLib.FileTest.EXISTS))
	{
		let content = Shell.get_file_contents_utf8_sync(file);
        content = text
		
		let f = Gio.file_new_for_path(file);
		let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
		Shell.write_string_to_stream (out, content);
	}
	else 
	{ global.logError("Radeon power profile manager : Error while reading file : " + file); }
}

// Init function
function init(metadata) 
{		
	return new ProfileManager(metadata);
}

