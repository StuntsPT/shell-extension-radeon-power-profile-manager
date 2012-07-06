Gnome-shell-extension-Radeon-Power-Profile-Manager
==================================================

##This small extension will allow you to change the power profile of your radeon card when using the open source drivers.

Since the "dynpm" mode does not work correctly for many Radeons, it is useful to have an alternative that you can control manually.
This extension is exactly for that and it is in my opinion a more elegant solution than using shell scripts.
The code still needs some restructuring, but for now it basically does the job.
This extension supports setups with multiple cards, just make sure that you apply the usage instructions to both "card0" and "card1".

##Usage instructions:

To use this extension you need:
* A Radeon card that supports power profiles - r1xx and up (needs confirmation, not sure about Northen and Southern Islands hardware);
* To be running the open source drivers;
* Make sure that */sys/class/drm/card0/device/power_method* is set to *profile*;
* Optional:
* Set the permissions of */sys/class/drm/card0/device/power_profile* to be writable by your user (by default only root can change these values);
    * *chmod a+w /sys/class/drm/card0/device/power_profile* will work, but feel free to use any other method;
    * to make the changes permanent don't forget to add the *chmod* line to your rc.local or equivalent in your distro (If your */etc/rc.local* contains an *exit 0* line, then the *chmod* line has to be placed **before** it);
    * **If you do not do this, the extension will simply ask for your password every time you change the profile.**

##Credits:

The code for this extension was written using gnome-shell-extension-tool and most of the code was based on the "simple todo list" from bsaleil (https://github.com/bsaleil/todolist-gnome-shell-extension). Big thanks to you!
The icons were created by Todd-partridge (https://github.com/Gen2ly) and slightly modified by myself.
The polkit approach was blatantly taken form gpiemont (https://github.com/gpiemont/shell-extension-nouveau-perflvl-switcher) how had based his extension on mine and applied some great ideas to it - which I have now backported. =-) Open source **is** awesome.

##License:
This software is licensed under the GPLv2.
