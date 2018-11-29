/**
 * @license
 * Copyright (c) 2018 XGDFalcon. All Rights Served.
 * This code may only be used under the license found at https://xgdfalcon.com/license
 *
 * XGDFalcon LLC retains all intellectual property rights to the code distributed as part of the
 * Peregrine Business Management package.
 */

import * as moment_ from 'moment';
const moment = moment_;

export enum LOGEVENTS {
  NONE = "UNKNOWN",
  ASSERT = "ASSERT",
  USER_AUTHENTICATION = "HTTPS_RESOURCE_FAILURE",
  USER_AUTHENTICATION_FAILED = "USER_AUTHENTICATION_FAILED",
  HTTPS_RESOURCE_SUCCESS = "HTTPS_RESOURCE_SUCCESS",
  HTTPS_RESOURCE_FAILURE = "HTTPS_RESOURCE_FAILURE"
}

export enum LOGLEVEL {i
  NONE = 0,
  TRACE = 1,
  INFO = 10,
  DEBUG = 20,
  WARNING = 30,
  ERROR = 100,
  FATAL = Number.MAX_VALUE
}

export enum LOGTARGET {
  NONE = 0x00,
  CONSOLE = 0x01,
  DISK = 0x02,
  DB = 0x04,
  SYSLOG = 0x08,
  RESERVED_1 = 0x10,
  RESERVED_2 = 0x20,
  RESERVED_3 = 0x40,
  RESERVED_4 = 0x80,
  LOGTARGET_MAX = 8
}

export function Log(level: LOGLEVEL, message: string, errorID?: LOGEVENTS) {
  const msg = "Logger Not Yet Configured";
  try {
    const logger = Logger.getInstance();
    logger.Log(level, message, errorID);
  } catch (error) {
    console.error(msg);
    throw Error(msg);
  }
}

export function Configure(level: LOGLEVEL, targets: LOGTARGET, dbInstance?: any, userID?: string): void {
  const msg = "Logger Configuration Failed";
  try {
    const logger = Logger.Configure(level, targets, dbInstance, userID);
    logger.Log(LOGLEVEL.INFO, "USER: " + userID, LOGEVENTS.ASSERT);
  } catch (error) {
    console.error(msg);
    throw Error(msg);
  }
}

export default class Logger {
  private static _instance: Logger;
  private DatetimeFormat: string = "YYYY-MM-DD HH:MM:SSS";
  private ConfiguredLogLevel: LOGLEVEL = LOGLEVEL.ERROR;
  private ConfiguredLogTargets: LOGTARGET = LOGTARGET.CONSOLE;
  private DBInstance: any; // firebase database for logging
  private UserID: string;

  private constructor(level: LOGLEVEL, targets: LOGTARGET, dbInstance?: any, userID?: string) {
    this.ConfiguredLogLevel = level;
    this.ConfiguredLogTargets = targets;
    this.DBInstance = dbInstance;
    this.UserID = (userID) ? "(" + userID + ")" : "(system)";

  }

  static getInstance() {
    return Logger._instance;
  }

  public static Configure(level: LOGLEVEL, targets: LOGTARGET, dbInstance?: any, userID?: string): Logger {
    if (!Logger._instance) {
      Logger._instance = new Logger(level, targets, dbInstance, userID);
      Logger._instance.Log(LOGLEVEL.INFO, "The XGD Logger has been started at level " + level, LOGEVENTS.ASSERT);
    }
    return Logger._instance;
  }

  public Log(level: LOGLEVEL, message: string, errorID?: LOGEVENTS): void {
    errorID = (errorID) ? errorID : LOGEVENTS.NONE;
    if ((level >= this.ConfiguredLogLevel || errorID === LOGEVENTS.ASSERT) && message != null) {
      this.WriteFormattedLog(level, message, errorID);
    }
  }

  /**
   * Format a log message based on log level
   * @param level the message log level
   * @param text  the message text
   * @param errorID the error id (optional)
   */
  private WriteFormattedLog(level: LOGLEVEL, text: string, errorID: LOGEVENTS): void {
    let pretext: string;
    switch (level) {
      case LOGLEVEL.TRACE: pretext = moment().format(this.DatetimeFormat) + " " + this.UserID + " [TRACE] "; break;
      case LOGLEVEL.INFO: pretext = moment().format(this.DatetimeFormat) + " " + this.UserID + " [INFO] "; break;
      case LOGLEVEL.DEBUG: pretext = moment().format(this.DatetimeFormat) + " " + this.UserID + " [DEBUG] "; break;
      case LOGLEVEL.WARNING: pretext = moment().format(this.DatetimeFormat) + " " + this.UserID + " [WARNING] "; break;
      case LOGLEVEL.ERROR: pretext = moment().format(this.DatetimeFormat) + " " + this.UserID + " [ERROR] "; break;
      case LOGLEVEL.FATAL: pretext = moment().format(this.DatetimeFormat) + " " + this.UserID + " [FATAL] "; break;
      default: pretext = ""; break;
    }

    (this.ConfiguredLogTargets & LOGTARGET.CONSOLE) != 0 ? this.Console(level, pretext, text) : null;
    (this.ConfiguredLogTargets & LOGTARGET.DB) != 0 ? this.WriteEventLog(pretext, text) : null;
  }

  private Console(level: LOGLEVEL, pretext: string, text: string): void {
    switch (level) {
      case LOGLEVEL.ERROR:
      case LOGLEVEL.FATAL:
        console.error(pretext + text);
      case LOGLEVEL.WARNING:
        console.warn(pretext + text);
      case LOGLEVEL.INFO:
        console.info(pretext + text);
      default:
        console.log(pretext + text);
    }
  }

  private WriteEventLog(pretext: string, text: string) {
    if (this.DBInstance) {
      this.DBInstance.push(pretext + text);
    }
  }
}