const { GObject, St, Clutter, Gio, GLib } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

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

        this._createMenu();
        this._updateIcon();
        this._updateMenu();

        this._startMonitoring();
    }

    _createMenu() {
        this._statusItem = new PopupMenu.PopupMenuItem('June is ready!', { reactive: false });
        this._statusItem.label.style_class = 'june-status-header';
        this.menu.addMenuItem(this._statusItem);
    }

    _updateMenu() {
        if (this._startupServiceActive) {
            this._statusItem.label.text = 'June is loading your apps...';
            this._statusItem.label.style_class = 'june-status-active';
        } else if (this._syncServiceActive) {
            this._statusItem.label.text = 'June is saving your apps...';
            this._statusItem.label.style_class = 'june-status-active';
        } else {
            this._statusItem.label.text = 'June is ready';
            this._statusItem.label.style_class = 'june-status-idle';
        }
    }

    _updateIcon() {
        this._icon.remove_style_class_name('june-spinner');

        if (this._startupServiceActive) {
            this._icon.set_icon_name('folder-download-symbolic');
        } else if (this._syncServiceActive) {
            this._icon.set_icon_name('process-working-symbolic');
            this._icon.add_style_class_name('june-spinner');
        } else {
            this._icon.set_icon_name('package-x-generic-symbolic');
        }

        this._updateMenu();
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
        this._stopMonitoring();
        super.destroy();
    }
});

class Extension {
    constructor() {
        this._indicator = null;
    }

    enable() {
        this._indicator = new JuneTrayIndicator();
        this._stylesheet = Gio.File.new_for_path(Me.dir.get_path() + '/stylesheet.css');
        Main.panel.addToStatusArea('june-tray', this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}

function init() {
    return new Extension();
}
