import Gio from 'gi://Gio'
import GLib from 'gi://GLib'

export const readJSONFile = function (path) {
    const decoder = new TextDecoder()
    const file = Gio.File.new_for_path(path)
    const [success, data/*, tag*/] = file.load_contents(null)
    if (!success) {
        throw new Error(`Failed to read file: ${path}`)
    }
    return JSON.parse(decoder.decode(data))
}

export const getEnv = function (name) {
    return GLib.getenv(name)
}
export const writeJSONFile = function (path, data) {
    const file = Gio.File.new_for_path(path)
    const parent = file.get_parent().get_path()
    GLib.mkdir_with_parents(parent, parseInt('0755', 8))
    const contents = JSON.stringify(data, null, 4)
    const [success/*, tag*/] = file.replace_contents(contents, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null)
}