/**
 * @license
 * Copyright (c) 2018 XGDFalcon. All Rights Served.
 * This code may only be used under the license found at https://xgdfalcon.com/license
 *
 * XGDFalcon LLC retains all intellectual property rights to the code distributed as part of the
 * Peregrine Business Management package.
 */

import * as crypto from 'crypto';

/**
 * Generates a unique ID for a `Thing`
 */
const generateID = () => {
  const b = crypto.randomBytes(12);
  const s = b.toString('base64');
  const e = s
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  return e;
};

/**
 * Base class for everything
 */
export class Thing extends Object {
  [key: string]: any;
  public id: string;
  public constructor() {
    super();
    this.id = generateID();
  }
}

/**
 * Enumerations of FSM error codes.
 * Can be extended to add special codes.
 */
export class ERROR_CODE {
  static CREATION_ERROR: string = 'CREATION_ERROR';
}

/**
 * Defines s `Dictionary` interface as
 * typescript does not provide one
 */
export interface IDictionary<TKey, T> {
  Add(key: TKey, value: T): void;
  ContainsKey(key: TKey): boolean;
  Count(): number;
  Item(key: TKey): T;
  Keys(): TKey[];
  Remove(key: TKey): T;
  Values(): T[];
}

/**
 * Defines s `Dictionary` class as
 * typescript does not provide one
 */
export class Dictionary<TKey extends Thing, T extends Thing> extends Thing
  implements IDictionary<TKey, T> {
  private _items: { [index: string]: T } = {};
  private _keys: { [index: string]: TKey } = {};

  private count: number = 0;

  public ContainsKey(key: TKey): boolean {
    return this._items.hasOwnProperty(key.id);
  }

  public Count(): number {
    return this.count;
  }

  public Add(key: TKey, value: T) {
    if (!this._items.hasOwnProperty(key.id)) this.count++;

    this._items[key.id] = value;
    this._keys[key.id] = key;
  }

  public Remove(key: TKey): T {
    var val = this._items[key.id];
    delete this._items[key.id];
    delete this._keys[key.id];
    this.count--;
    return val;
  }

  public Item(key: TKey): T {
    return this._items[key.id];
  }

  public Keys(): TKey[] {
    var keySet: TKey[] = [];
    for (var prop in this._keys) {
      if (this._keys.hasOwnProperty(prop)) {
        keySet.push(this._keys[prop]);
      }
    }
    return keySet;
  }

  public Values(): T[] {
    var values: T[] = [];

    for (var prop in this._items) {
      if (this._items.hasOwnProperty(prop)) {
        values.push(this._items[prop]);
      }
    }

    return values;
  }
}
/**
 * Error class thrown by a state machine.
 */
export class FSMError extends Error {
  errorCode: string;
  method: string;
  operation: string;

  public constructor(code: string, method: string, operation: string, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.errorCode = code;
    this.method = method;
    this.operation = operation;
  }
}

/**
 * Implemented by a context. This is the only way
 * of interaction between the state classes and the
 * context.
 */
export interface IEventSink {
  castEvent(event: FSMEvent): void;
}

export class FSMEvent extends Thing {
  private _name: string = 'unknown';

  public constructor(name: string) {
    super();
    Object.setPrototypeOf(this, new.target.prototype);
    if (name === null)
      throw new FSMError(ERROR_CODE.CREATION_ERROR, 'constructor', 'FSMEvent', "'name' Undefined");
    this._name = name;
  }

  public get name(): string | null {
    return this._name;
  }
}

/**
 * class for all state classes.
 */
export abstract class StateBase<AI> extends Thing {
  protected _automaton: AI | null = null;
  protected _eventSink: IEventSink | null = null;

  public constructor(automaton: AI, eventSink: IEventSink) {
    super();
    Object.setPrototypeOf(this, new.target.prototype);
    if (automaton === null || eventSink === null) {
      throw new FSMError(
        ERROR_CODE.CREATION_ERROR,
        'constructor',
        'StateBase',
        "'automaton' or 'eventSink' Undefined"
      );
    }
    this._automaton = automaton;
    this._eventSink = eventSink;
  }

  protected castEvent(ev: FSMEvent): void {
    if (this._eventSink) {
      this._eventSink.castEvent(ev);
    }
  }
}

/**
 * base class for all automata. It
 * provides a method addEdge for its subclasses.
 * In addition AutomatonBase implements IEventSink:
 */
export abstract class AutomatonBase<AI extends Thing> extends Thing implements IEventSink {
  constructor() {
    super();
  }

  protected state: AI | null = null;
  private edges: Dictionary<AI, Dictionary<FSMEvent, AI>> = new Dictionary<
    AI,
    Dictionary<FSMEvent, AI>
  >();
  protected addEdge(source: AI, ev: FSMEvent, target: AI): void {
    let row: Dictionary<FSMEvent, AI> = this.edges[source.id];
    if (null == row) {
      row = new Dictionary<FSMEvent, AI>();
      this.edges.Add(source, row);
    }
    row.Add(ev, target);
  }
  public castEvent(ev: FSMEvent): void {
    if (this.edges && this.state) {
      this.state = this.edges[this.state.id][ev.id];
    }
  }
}

export default interface XGDFiniteStateMachine {}
