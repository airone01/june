const { GObject, St, Clutter, Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const MSG_STATUS_READY   = "June is ready and loaded!";
const MSG_STATUS_SYNC    = "June is saving your apps...";
const MSG_STATUS_STARTUP = "June is loading your apps...";

var JuneTrayIndicator = GObject.registerClass(
class JuneTrayIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'June Tray');

        this._icon = new St.Icon({
            style_class: 'system-status-icon',
            icon_size: 16
        });

        this.add_child(this._icon);

        this._startupServiceActive = false;
        this._syncServiceActive = false;

        this.syncFramePaths = [];
        for (let i = 0; i <= 8; i++) {
            this.syncFramePaths.push(`${Me.dir.get_path()}/icons/sync_${i.toString().padStart(2, '0')}.png`);
        }
        this._currentFrame = 0;
        this._animationTimeoutId = null;

        this._createMenu();
        this._updateIcon();
        this._updateMenu();

        this._startMonitoring();
    }

    _createMenu() {
        this._statusItem = new PopupMenu.PopupMenuItem(MSG_STATUS_READY, { reactive: false });
        this._statusItem.label.style_class = 'june-status-header';
        this.menu.addMenuItem(this._statusItem);
    }

    _updateMenu() {
        if (this._startupServiceActive) {
            this._statusItem.label.text = MSG_STATUS_STARTUP;
            this._statusItem.label.style_class = 'june-status-active';
        } else if (this._syncServiceActive) {
            this._statusItem.label.text = MSG_STATUS_SYNC;
            this._statusItem.label.style_class = 'june-status-active';
        } else {
            this._statusItem.label.text = MSG_STATUS_READY;
            this._statusItem.label.style_class = 'june-status-idle';
        }
    }

    _updateIcon() {
        this._icon.remove_style_class_name('june-spinner');
        this._stopAnimation();

        if (this._startupServiceActive || this._syncServiceActive) {
            this._icon.add_style_class_name('june-spinner');
            this._startAnimation();
        } else {
            this._icon.set_icon_name('package-x-generic-symbolic');
        }

        this._updateMenu();
    }

    _startAnimation() {
        if (this._animationTimeoutId) return;

        this._setFrame(this._currentFrame);

        const frameDelay = 125; // 125ms per frame for ~8fps (adjust as needed)
        this._animationTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, frameDelay, () => {
            this._currentFrame = (this._currentFrame + 1) % this.syncFramePaths.length;
            this._setFrame(this._currentFrame);
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopAnimation() {
        if (this._animationTimeoutId) {
            GLib.source_remove(this._animationTimeoutId);
            this._animationTimeoutId = null;
        }
        this._currentFrame = 0;
    }

    _setFrame(index) {
        try {
            let gicon = Gio.icon_new_for_string(this.syncFramePaths[index]);
            this._icon.gicon = gicon;
        } catch (e) {
            logError(e, 'Failed to load frame ' + index);
        }
    }

    _checkServiceStatus() {
        this._checkStartupService();
        this._checkSyncService();
    }

    _checkStartupService() {
        try {
            let proc = Gio.Subprocess.new(
                ['systemctl', '--user', 'is-active', 'june_startup.service'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    let wasActive = this._startupServiceActive;
                    this._startupServiceActive = stdout.trim() === 'activating';

                    if (wasActive !== this._startupServiceActive) {
                        this._updateIcon();
                    }
                } catch (e) {
                    this._startupServiceActive = false;
                    this._updateIcon();
                }
            });
        } catch (e) {
            this._startupServiceActive = false;
            this._updateIcon();
        }
    }

    _checkSyncService() {
        try {
            let proc = Gio.Subprocess.new(
                ['systemctl', '--user', 'is-active', 'june_sync.service'],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    let wasActive = this._syncServiceActive;
                    this._syncServiceActive = stdout.trim() === 'active';

                    if (wasActive !== this._syncServiceActive) {
                        this._updateIcon();
                    }
                } catch (e) {
                    this._syncServiceActive = false;
                    this._updateIcon();
                }
            });
        } catch (e) {
            this._syncServiceActive = false;
            this._updateIcon();
        }
    }

    _startMonitoring() {
        this._checkServiceStatus();

        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
            this._checkServiceStatus();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopMonitoring() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = null;
        }
    }

    destroy() {
        this._stopAnimation();
        this._stopMonitoring();
        super.destroy();
    }
});

class Extension {
    constructor() {
        this._indicator = null;
        this._theme = null;
        this._stylesheet = null;
    }

    enable() {
        this._theme = St.ThemeContext.get_for_stage(global.stage).get_theme();
        this._stylesheet = Gio.File.new_for_path(Me.dir.get_path() + '/stylesheet.css');
        this._theme.load_stylesheet(this._stylesheet);

        this._indicator = new JuneTrayIndicator();
        Main.panel.addToStatusArea('june-tray', this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        if (this._theme && this._stylesheet) {
            this._theme.unload_stylesheet(this._stylesheet);
        }
    }
}

function init() {
    return new Extension();
}
