import merge from "lodash.merge"
import * as appRoot from "app-root-path"
import * as fs from "fs"
import * as yaml from "js-yaml"

function readConfig(file: string) {
    return yaml.load(fs.readFileSync(file, "utf-8"));
}

function loadConfig(overrideFile: string) {
    //need appRoot for cases where node is not run from app directory
    let defaultConfig = readConfig(appRoot + "/config.yml");
    let overwriteConfig = overrideFile ? readConfig(overrideFile) : {};

    /* The last files will take the highest precedence */
    let config = merge(defaultConfig, overwriteConfig); //can be chained if needed
    //console.log("config: " + JSON.stringify(config, null, 4));
    return config;
}

module.exports = {
    loadConfig: loadConfig
};
