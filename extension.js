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
    this.powerMethod0 = "/sys/class/drm/card0/device/power_method"
    this.profile1 = "/sys/class/drm/card1/device/power_profile"
    this.powerMethod1 = "/sys/class/drm/card1/device/power_method"

    //Test if the power_method file is set for profile:
    if (CheckForFile(this.powerMethod0) == 1)
    {
        CheckMethod(this.powerMethod0);
    }
    else
    {
        global.logError("Radeon Power Profile Manager: Error while reading file : " + filename);
    }

    //Test if a second card is present and if it is, define it:
    if (CheckForFile(this.profile1) == 1)
    {
        if (CheckForFile(this.powerMethod1) == 1)
        {
            CheckMethod(this.powerMethod1);
        }
    }
    else
    {
        global.logError("Radeon Power Profile Manager: Second card not found, working with single card.");
        this.profile1 = 0;
    }

    //Set the icons:
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
            let varfile1 = this.profile0;
            let varfile2 = this.profile1;
            let tasksMenu = this.menu;

            let temp = this.temp;

            // Clear
            tasksMenu.removeAll();

            // Sync
            if (CheckForFile(this.profile0) == 1)
            {
                let content = Shell.get_file_contents_utf8_sync(this.profile0);

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
                changeProfile("low",varfile1);
                if (varfile2 != 0)      {changeProfile("low",varfile2);}
            });

            midpowerbutton.connect('activate',function()
            {
                temp.remove_actor(Icon);
                changeProfile("mid",varfile1);
                if (varfile2 != 0)      {changeProfile("mid",varfile2);}
            });

            highpowerbutton.connect('activate',function()
            {
                temp.remove_actor(Icon);
                changeProfile("high",varfile1);
                if (varfile2 != 0)      {changeProfile("high",varfile2);}
            });
        },

        _enable: function()
        {
            // Refresh menu
            let fileM = Gio.file_new_for_path(this.profile0);
            this.monitor = fileM.monitor(Gio.FileMonitorFlags.NONE, null);
            this.monitor.connect('changed', Lang.bind(this, this._refresh));
        },

        _disable: function()
        {
            this.monitor.cancel();
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
            let [success, argv] = GLib.shell_parse_argv(_("pkexec /bin/sh -c " + "\"" + " echo " + text + " > " + file + "\""));
            GLib.spawn_async_with_pipes(null, argv, null, GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                            null, null);
        }
    }
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
    method = Shell.get_file_contents_utf8_sync(filename);
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