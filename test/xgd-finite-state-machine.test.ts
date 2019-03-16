/**
 * @license
 * Copyright (c) 2019 XGDFalcon®. All Rights Reserved.
 * This code may only be used under the license found in the included LICENSE.md
 *
 * XGDFalcon LLC retains all intellectual property rights to the code distributed as part of the
 * Peregrine Business Management package.
 */

import {
  FSM_ERROR_CODE,
  StateBase,
  StateMachineContext,
  FSMEvent,
  IEventSink,
  FSMError,
  AutomationInterface
} from '../src/xgd-finite-state-machine';

// import { describe, it, expect } from 'jest';

class ConnectionEvents {
  public static CONNECT: FSMEvent = new FSMEvent('CONNECT');
  public static ERROR: FSMEvent = new FSMEvent('ERROR');
  public static DISCONNECT: FSMEvent = new FSMEvent('DISCONNECT');
}
class ConnectionErrors extends FSM_ERROR_CODE {
  public static CONNECTION_FAILURE = 'CONNECTION_FAILURE';
}
interface IConnection extends AutomationInterface {
  connect(): void;
  disconnect(): void;
  receive(): number;
  send(value: number): void;
}

class ConnectedState extends StateBase<IConnection> {
  protected socket: any;

  public constructor(automaton: IConnection, eventSink: IEventSink, socket: any) {
    super(automaton, eventSink);
    this.socket = socket;
  }

  public connect(): void {
    // already connected
  }
  public disconnect(): void {
    try {
      this.socket('disconnect');
    } finally {
      super.castEvent(ConnectionEvents.DISCONNECT);
    }
  }
  public receive(): number {
    try {
      this.socket('receive');
      return 1;
    } catch (e) {
      super.castEvent(ConnectionEvents.ERROR);
      throw new FSMError(ConnectionErrors.CONNECTION_FAILURE, 'receive', 'ConnectedState', e);
    }
  }

  public send(value: number): void {
    try {
      this.socket('SEND: ' + value);
    } catch (e) {
      super.castEvent(ConnectionEvents.ERROR);
      throw new FSMError(ConnectionErrors.CONNECTION_FAILURE, 'send', 'ConnectedState', e);
    }
  }
}

class DisconnectedState extends StateBase<IConnection> {
  protected socket: any;
  public constructor(automaton: IConnection, eventSink: IEventSink, socket: any) {
    super(automaton, eventSink);
    this.socket = socket;
  }
  public connect(): void {
    try {
      this.socket('Connect');
      super.castEvent(ConnectionEvents.CONNECT);
    } catch (e) {
      super.castEvent(ConnectionEvents.ERROR);
      throw new FSMError(ConnectionErrors.CONNECTION_FAILURE, 'connect', 'DisconnectedState', e);
    }
    super.castEvent(ConnectionEvents.CONNECT);
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

export class ConnectionFSM extends StateMachineContext<IConnection> {
  public id: string = 'ConnectionFSM';
  protected connected: ConnectedState;
  protected disconnected: DisconnectedState;

  public constructor(store: any) {
    super();
    this.connected = new ConnectedState(this, this, store);
    this.disconnected = new DisconnectedState(this, this, store);
    this._currentState = this.disconnected; // set default state

    super.addTransition(this.disconnected, new FSMEvent('CONNECT'), this.connected);
    super.addTransition(this.connected, new FSMEvent('DISCONNECT'), this.disconnected);
    super.addTransition(this.connected, new FSMEvent('ERROR'), this.disconnected);
  }
  public castEvent(ev: FSMEvent): void {
    super.castEvent(ev);
  }
  connect(): void {
    try {
      this._currentState!.connect();
    } catch (error) {
      console.error(error);
    }
  }
  disconnect(): void {
    try {
      this._currentState!.disconnect();
    } catch (error) {
      console.error(error);
    }
  }
  receive(): number {
    return this._currentState!.receive();
  }
  send(value: number): void {
    return this._currentState!.send(value);
  }
}

/**
 * Dummy test
 */
describe('Test', () => {
  it('works if true is truthy', () => {
    const fsm = new ConnectionFSM(console.log);
    fsm.connect();
    fsm.send(12345);
    fsm.disconnect();
    // fsm.connect();
    // fsm.disconnect();
    // fsm.connect();
    // fsm.disconnect();
  });
  it('works if true is truthy', () => {
    expect(true).toBeTruthy();
  });
});
