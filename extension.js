// This extension was developed by :
// * Francisco Pina Martins https://github.com/StuntsPT
//
// Licence: GPLv2
//
// Copyright 2012 Francisco Pina Martins
//
// This file is part of Radeon Power Profile Manager.
//
// Radeon Power Profile Manager is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 2 of the License, or
// (at your option) any later version.

// Radeon Power Profile Manager is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Radeon Power Profile Manager.  If not, see <http://www.gnu.org/licenses/>.

const St = imports.gi.St;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Main = imports.ui.main;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;

const Clutter = imports.gi.Clutter

// ProfileManager function
function ProfileManager(metadata)
{
    //Stub files for testing:
    //this.file = metadata.path + "/stubs/power_profile";
    //this.powerMethod = metadata.path + "/stubs/power_method";
    //this.second_card = metadata.path + "/stubs/power_profile2";
    //this.powerMethod2 = metadata.path + "/stubs/power_method";

    this.file = "/sys/class/drm/card0/device/power_profile";
    this.powerMethod = "/sys/class/drm/card0/device/power_method"
    this.second_card = "/sys/class/drm/card1/device/power_profile"
    this.powerMethod2 = "/sys/class/drm/card1/device/power_method"

    //Test if the power_method file is set for profile:
    if (CheckForFile(this.powerMethod) == 1)
    {
	CheckMethod(this.powerMethod);
    }

    //Test if a second card is present and if it is, define it:
    if (CheckForFile(this.second_card) == 1)
    {
	if (CheckForFile(this.powerMethod2) == 1)
	{
	    CheckMethod(this.powerMethod2);
	}
    }
    else
    {
	global.logError("Radeon Power Profile Manager: Second card not present, working with single card.");
	this.second_card = 0;
    }

    this.LowPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/low.svg");
    this.MidPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/mid.svg");
    this.HighPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/high.svg");

    this._init();
}

// Prototype
ProfileManager.prototype =
{
	__proto__: PanelMenu.Button.prototype,

    	_init: function()
    	{
	    PanelMenu.Button.prototype._init.call(this, St.Align.START);

	    this.temp = new St.BoxLayout();
	    this.temp.set_width(24);
	    this.temp.set_height(24);

	    this.actor.add_actor(this.temp);
	    this.actor.add_style_class_name('panel-status-button');
	    this.actor.has_tooltip = false;

	    this._refresh();

        },

	_refresh: function()
	{
	    let varFile = this.file;
	    let card2 = this.second_card;
	    let tasksMenu = this.menu;

	    let temp = this.temp;

	    // Clear
	    tasksMenu.removeAll();

	    // Sync
	    if (CheckForFile(this.file) == 1)
	    {
		let content = Shell.get_file_contents_utf8_sync(this.file);

		let message = "Currently on '" + content.trim() + "' profile";
		let item = new PopupMenu.PopupMenuItem(_(message));
		tasksMenu.addMenuItem(item);

		if (content.trim() == "low")
		{
		    Icon = this.LowPowerIcon;
		}
		else if (content.trim() == "mid")
		{
		    Icon = this.MidPowerIcon;
		}
		else
		{
		    Icon = this.HighPowerIcon;
		}
		temp.add_actor(Icon,1);
	    }

	    // Separator
	    this.Separator = new PopupMenu.PopupSeparatorMenuItem();
	    tasksMenu.addMenuItem(this.Separator);

	    // Bottom section
	    let bottomSection = new PopupMenu.PopupMenuSection();

	    //Create power profile changing buttons:
	    let lowpowerbutton = new PopupMenu.PopupMenuItem(_("Set profile to 'low'"));
	    tasksMenu.addMenuItem(lowpowerbutton);
	    let midpowerbutton = new PopupMenu.PopupMenuItem(_("Set profile to 'mid'"));
	    tasksMenu.addMenuItem(midpowerbutton);
	    let highpowerbutton = new PopupMenu.PopupMenuItem(_("Set profile to 'high'"));
	    tasksMenu.addMenuItem(highpowerbutton);

	    //Give the buttons an action:
	    lowpowerbutton.connect('activate',function()
	    {
		temp.remove_actor(Icon);
		changeProfile("low",varFile);
		if (card2 != 0)	{changeProfile("low",card2);}
	    });

	    midpowerbutton.connect('activate',function()
	    {
		temp.remove_actor(Icon);
		changeProfile("mid",varFile);
		if (card2 != 0)	{changeProfile("mid",card2);}
	    });

	    highpowerbutton.connect('activate',function()
	    {
		temp.remove_actor(Icon);
		changeProfile("high",varFile);
		if (card2 != 0)	{changeProfile("high",card2);}
	    });
	},

	enable: function()
	{
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
	    Main.panel._rightBox.remove_actor(this.actor);
	    this.monitor.cancel();
	}
}


// Change power profile "text" in sysfs file "file"
function changeProfile(text,file)
{
    if (CheckForFile(file) == 1)
    {
	let content = Shell.get_file_contents_utf8_sync(file);
        content = text

	let f = Gio.file_new_for_path(file);
	let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
	Shell.write_string_to_stream (out, content);
    }
}

function CheckForFile(filename)
{
    if (GLib.file_test(filename, GLib.FileTest.EXISTS))
    {
	return 1;
    }
    else if (filename.indexOf("/card1/") != -1)
    {
	global.logError("Radeon Power Profile Manager: Error while reading file : " + filename);
	return 0;
    }
}

function CheckMethod(filename)
{
    //Will check if the current power_method is set to 'profile'
    method = Shell.get_file_contents_utf8_sync(filename);
    if (method.trim() != "profile")
    {
	global.logError("Radeon Power Profile Manager: " + filename + " is not set for 'profile'. Please change this.");
    }
}

// Init function
function init(metadata)
{
	return new ProfileManager(metadata);
}
