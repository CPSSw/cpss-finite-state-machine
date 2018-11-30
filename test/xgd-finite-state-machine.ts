/**
 * @license
 * Copyright (c) 2018 XGDFalcon. All Rights Served.
 * This code may only be used under the license found at https://xgdfalcon.com/license
 *
 * XGDFalcon LLC retains all intellectual property rights to the code distributed as part of the
 * Peregrine Business Management package.
 */

import {
  ERROR_CODE,
  StateBase,
  FSMEvent,
  Thing,
  IEventSink,
  FSMError
} from '../src/xgd-finite-state-machine';

class ConnectionErrors extends ERROR_CODE {
  public static CONNECTION_FAILURE = 'CONNECTION_FAILURE';
}
interface IConnection extends Thing {
  connect(): void;
  disconnect(): void;
  receive(): number;
  send(value: number): void;
}

class ConnectedState<IConnection> extends StateBase<IConnection> {
  public static DISCONNECT: FSMEvent = new FSMEvent('DISCONNECT');
  public static ERROR: FSMEvent = new FSMEvent('ERROR');
  protected socket = console;
  public constructor(automaton: IConnection, eventSink: IEventSink, socket: any) {
    super(automaton, eventSink);
    this.socket = socket;
  }

  public connect(): void {
    // already connected
  }
  public disconnect(): void {
    try {
      this.socket.log('disconnect');
    } finally {
      this.eventSink.castEvent(this.DISCONNECT);
    }
  }
  public receive(): number {
    try {
      console.log('receive');
      return 1;
    } catch (e) {
      this.eventSink.castEvent(this.ERROR);
      throw new FSMError(ConnectionErrors.CONNECTION_FAILURE, 'receive', 'ConnectedState', e);
    }
  }

  public send(value: number): void {
    try {
      this.socket.log('SEND: ' + value);
    } catch (e) {
      this.eventSink.castEvent(this.ERROR);
      throw new FSMError(ConnectionErrors.CONNECTION_FAILURE, 'send', 'ConnectedState', e);
    }
  }
}

class DisconnectedState<IConnection> extends StateBase<IConnection> {
  public static DISCONNECT: FSMEvent = new FSMEvent('DISCONNECT');
  public static ERROR: FSMEvent = new FSMEvent('ERROR');
  protected socket = console;
  public constructor(automaton: IConnection, eventSink: IEventSink, socket: any) {
    super(automaton, eventSink);
    this.socket = socket;
  }
  public connect(): void {
    try {
      this.socket.log('Connect');
    } catch (e) {
      this.eventSink.castEvent(this.ERROR);
      throw new FSMError(ConnectionErrors.CONNECTION_FAILURE, 'connect', 'DisconnectedState', e);
    }
    this.eventSink.castEvent(this.CONNECT);
  }
  public disconnect(): void {}
  public receive(): number {
    throw new FSMError(
      ConnectionErrors.CONNECTION_FAILURE,
      'receive',
      'DisconnectedState',
      'Connection is Closed'
    );
  }
  public send(value: number): void {
    throw new FSMError(
      ConnectionErrors.CONNECTION_FAILURE,
      'send',
      'DisconnectedState',
      'Connection is Closed'
    );
  }
}
/**
 * Dummy test
 */
describe('Logger test', () => {
  it('works if true is truthy', () => {
    expect(true).toBeTruthy();
  });

  it('Logger is configurable', () => {
    expect(Configure(LOGLEVEL.INFO, LOGTARGET.CONSOLE, null, 'xgdfalcon')).toBeInstanceOf(Logger);
  });

  it('Logger is configurable', () => {
    expect(Log(LOGLEVEL.INFO, 'This is a test of the Log export', LOGEVENTS.ASSERT));
  });
  it('Logger is configurable', () => {
    expect(Logger.Configure(LOGLEVEL.INFO, LOGTARGET.CONSOLE, null, 'xgdfalcon')).toBeInstanceOf(
      Logger
    );
  });

  it('Logger is configurable', () => {
    expect(
      Logger.getInstance().Log(
        LOGLEVEL.INFO,
        'This is a test of accessing directly',
        LOGEVENTS.ASSERT
      )
    );
  });
});
