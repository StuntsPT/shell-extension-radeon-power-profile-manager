Gnome-shell-extension-Radeon-Power-Profile-Manager
==================================================

##This small extension will allow you to change the power profile of your radeon card when using the open source drivers.

Since the "dynpm" mode does not work correctly for many Radeons, it is useful to have an alternative that you can control manually.
This extension is exactly for that and it is in my opinion a more elegant solution than using shell scripts.
It still needs some work to make it look better, but for now it basically does the job.

##Usage instructions:

To use this extension you need:
*A Radeon card that supports power profiles - r1xx and up (needs confirmation, not sure about Northen and Southern Islands hardware);
*To be running the open source drivers;
*Last but not least, set the permissions of /sys/class/drm/card0/device/power_profile to be writable by your user (by default only root can change these values);
    * *chmod a+w /sys/class/drm/card0/device/power_profile* will work, but feel free to use any other method (polkit, etc...);
    * to make the changes permanent don't forget to add the *chmod* line to your rc.local or equivalent in your distro;

##Credits:
The code for this extension was written using gnome-shell-extension-tool and most of the code was based on the "simple todo list" from bsaleil (https://github.com/bsaleil/todolist-gnome-shell-extension). Big thanks to you!
