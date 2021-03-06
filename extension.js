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

let meta;
let profilemanager;
let Icon = "";

// ProfileManager function
function ProfileManager(metadata)
{
    //Stub files for testing:
    //this.profile0 = metadata.path + "/stubs/power_profile";
    //this.powerMethod = metadata.path + "/stubs/power_method";
    //this.profile1 = metadata.path + "/stubs/power_profile2";
    //this.powerMethod2 = metadata.path + "/stubs/power_method";

    //Define variables for the sysfs files:
    this.profile0 = "/sys/class/drm/card0/device/power_profile";
    this.powerMethod0 = "/sys/class/drm/card0/device/power_method";
    this.profile1 = "/sys/class/drm/card1/device/power_profile";
    this.powerMethod1 = "/sys/class/drm/card1/device/power_method";
    this.foundCard = 0;

    //Test if the power_method file is set for profile:
    if (CheckForFile(this.powerMethod0) == 1)
    {
        CheckMethod(this.powerMethod0);
        this.foundCard = 1;
    }

    //Test if a second card is present and if it is, define it:
    if (CheckForFile(this.profile1) == 1)
    {
        if (CheckForFile(this.powerMethod1) == 1)
        {
            CheckMethod(this.powerMethod1);
            this.foundCard = 1;
        }
    }

    if (this.foundCard != 1)
    {
        global.logError("Radeon Power Profile Manager: No cards found!");
    }

    //Set the icons:
    this.LowPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/low.svg");
    this.MidPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/mid.svg");
    this.HighPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/high.svg");
    this.AutoPowerIcon=Clutter.Texture.new_from_file(metadata.path+"/auto.svg");

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
			let varfile0 = this.profile0;
            let varfile1 = this.profile1;
            let tasksMenu = this.menu;

            let temp = this.temp;
            let content = 0;

            // Clear
            tasksMenu.removeAll();

            // Sync
            if (CheckForFile(this.profile0) == 1)
            {
                content = Shell.get_file_contents_utf8_sync(this.profile0);
            }
            else
            {
                content = Shell.get_file_contents_utf8_sync(this.profile1);
            }

            let message = "Currently on '" + content.trim() + "' profile";
            let item = new PopupMenu.PopupMenuItem(_(message));
            tasksMenu.addMenuItem(item);
            if (Icon != "") {temp.remove_actor(Icon);}

            if (content.trim() == "low")
            {
                Icon = this.LowPowerIcon;
            }
            else if (content.trim() == "mid")
            {
                Icon = this.MidPowerIcon;
            }
            else if (content.trim() == "auto")
            {
                Icon = this.AutoPowerIcon;
            }
            else
            {
                Icon = this.HighPowerIcon;
            }
            temp.add_actor(Icon,1);

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
            let autopowerbutton = new PopupMenu.PopupMenuItem(_("Set profile to 'auto'"));
            tasksMenu.addMenuItem(autopowerbutton);

            //Give the buttons an action:
            lowpowerbutton.connect('activate',function()
            {
                changeProfile("low",varfile0);
                changeProfile("low",varfile1);
            });

            midpowerbutton.connect('activate',function()
            {
                changeProfile("mid",varfile0);
                changeProfile("mid",varfile1);
            });

            highpowerbutton.connect('activate',function()
            {
                changeProfile("high",varfile0);
                changeProfile("high",varfile1);
            });

            autopowerbutton.connect('activate',function()
            {
                changeProfile("auto",varfile0);
                changeProfile("auto",varfile1);	
            });
        },

        _enable: function()
        {
            // Refresh menu
            let fileM = Gio.file_new_for_path(this.profile0);
            this.monitor1 = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
            this.monitor1.connect('changed', Lang.bind(this, this._refresh));
            // Refresh second card menu
            let fileM2 = Gio.file_new_for_path(this.profile1);
            this.monitor2 = fileM2.monitor(Gio.FileMonitorFlags.NONE, null);
            this.monitor2.connect('changed', Lang.bind(this, this._refresh));
        },

        _disable: function()
        {
            this.monitor1.cancel();
            this.monitor2.cancel();
        }
}


//Change power profile "text" in sysfs file "file". Will use polkit to
//elevate privileges if the user does not have write access to the
//required sysfs file.
function changeProfile(text,file)
{
    if (CheckForFile(file) == 1)
    {
        if (GLib.access(file, 2) == 0)
        {
            let content = Shell.get_file_contents_utf8_sync(file);
            content = text

            let f = Gio.file_new_for_path(file);
            let out = f.replace(null, false, Gio.FileCreateFlags.NONE, null);
            Shell.write_string_to_stream (out, content);
        }
        else
        {
            let [result, argv] = GLib.shell_parse_argv(_("pkexec /bin/bash -c \" echo '" + text + "' > " + file + "\""));

            if (result)
            {
                try {
                    [result, pid] = GLib.spawn_async_with_pipes(null, argv, null, GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                            null, null);
                } catch (e) {
                    global.logError("Radeon Power Profile Manager: Failed to change profile with elevated privileges using polkit.");
                }
            }
            return result;
          }
    }

	return -1;
}

function CheckForFile(filename)
{
    //Checks for the existance of a file
    if (GLib.file_test(filename, GLib.FileTest.EXISTS))
    {
        return 1;
    }
    else
    {
        return 0;
    }
}

function CheckMethod(filename)
{
    //Will check if the current power_method is set to 'profile'
    let method = Shell.get_file_contents_utf8_sync(filename);
    if (method.trim() != "profile")
    {
        global.logError("Radeon Power Profile Manager: " + filename + " is not set for 'profile'. Please change this.");
    }
}

// Init function
function init(metadata)
{
        meta = metadata;
}

function enable()
{
    profilemanager = new ProfileManager(meta);
    profilemanager._enable();
    Main.panel.addToStatusArea('profilemanager', profilemanager);
}

function disable()
{
    profilemanager._disable();
    profilemanager.destroy();
    profilemanager = null;
}
