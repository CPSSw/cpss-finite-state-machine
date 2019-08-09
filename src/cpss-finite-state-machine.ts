/**
 * @license
 * Copyright (c) 2019 XGDFalcon®. All Rights Reserved.
 * This code may only be used under the license found in the included LICENSE.md
 *
 * XGDFalcon LLC retains all intellectual property rights to the code distributed
 * as part of the Control Point System Software (CPSS) Package.
 */

/**
 * Generates a unique ID for a `Thing`
 */
const generateID = () => {
  return Math.random()
    .toString(36)
    .substring(7);
};

const EXISTS = (item: any): boolean => {
  return item !== null && typeof item !== 'undefined';
};
/**
 * Enumerations of FSM error codes.
 * Can be extended to add special codes.
 */
export class FsmErrorCode {
  static CREATION_ERROR: string = 'CREATION_ERROR';
  static EVENT_ERROR: string = 'EVENT_ERROR';
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
export class Dictionary<TKey extends any, T> implements IDictionary<TKey, T> {
  [key: string]: any;
  public id: string = generateID();

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
    const val = this._items[key.id];
    delete this._items[key.id];
    delete this._keys[key.id];
    this.count--;
    return val;
  }

  public Item(key: TKey): T {
    return this._items[key.id];
  }

  public Keys(): TKey[] {
    const keySet: TKey[] = [];
    for (const prop in this._keys) {
      if (this._keys.hasOwnProperty(prop)) {
        keySet.push(this._keys[prop]);
      }
    }
    return keySet;
  }

  public Values(): T[] {
    const values: T[] = [];

    for (const prop in this._items) {
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

export abstract class AutomationInterface {
  [key: string]: any;
  public id: string;
  constructor(id?: string) {
    if (id) {
      this.id = id;
    } else {
      this.id = generateID();
    }
  }
}

export class FSMEvent {
  private _name: string = 'undefined';

  public constructor(name: string) {
    Object.setPrototypeOf(this, new.target.prototype);
    if (name === null)
      throw new FSMError(
        FsmErrorCode.CREATION_ERROR,
        'constructor',
        'FSMEvent',
        "'name' Undefined"
      );
    this._name = name;
  }

  public get id(): string {
    return this._name;
  }
  public get name(): string {
    return this._name;
  }
}

/**
 * Base class for states.
 * <AI> provides the interface being automated.
 */
export abstract class StateBase<AI extends AutomationInterface> {
  protected _automaton: AI | null = null;
  protected _eventSink: IEventSink | null = null;
  public id: string;
  public constructor(automaton: AI, eventSink: IEventSink) {
    Object.setPrototypeOf(this, new.target.prototype);
    if (automaton === null || eventSink === null) {
      throw new FSMError(
        FsmErrorCode.CREATION_ERROR,
        'constructor',
        'StateBase',
        "'automaton' or 'eventSink' Undefined"
      );
    }
    this._automaton = automaton;
    this._eventSink = eventSink;
    // this.id = Object.getPrototypeOf(this).constructor.name;
    this.id = generateID();
  }

  protected castEvent(ev: FSMEvent): void {
    if (this._eventSink) {
      this._eventSink.castEvent(ev);
    }
  }
}

/**
 * Base class for all state machines. It provides
 * a method to add transitions for its subclasses.
 * In addition StateMachineContext implements IEventSink:
 */
export abstract class StateMachineContext<AI extends AutomationInterface> implements IEventSink {
  protected _currentState: AI | any;
  private _transitions: Dictionary<AI, Dictionary<FSMEvent, AI>> = new Dictionary<
    AI,
    Dictionary<FSMEvent, AI>
  >();

  protected addTransition(source: AI, ev: FSMEvent, target: AI): void {
    let stateTransitions: Dictionary<FSMEvent, AI> = this._transitions.Item(source);
    if (stateTransitions === null || typeof stateTransitions === 'undefined') {
      // Create new state
      stateTransitions = new Dictionary<FSMEvent, AI>();
      this._transitions.Add(source, stateTransitions);
    }
    stateTransitions.Add(ev, target);
  }

  public castEvent(ev: FSMEvent): void {
    if (EXISTS(this._transitions) && EXISTS(this._currentState)) {
      const newState: AI = this._transitions.Item(this._currentState).Item(ev);
      if (EXISTS(newState)) {
        this._currentState = newState;
        console.log(`NewState: ${this._currentState.id}`);
      }
    }
  }
}

export default interface XGDFiniteStateMachine {}
