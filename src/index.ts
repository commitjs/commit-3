import '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js';
import 'reflect-metadata';
import { html, render, directive, NodePart, TemplateResult } from 'lit-html';

interface IUseState<T> {
  value: T,
  directive: (n: NodePart) => void;
}

interface IComponent {
  _update: () => void;
}

const useState = <T>(value: T): IUseState<T> => {
  let node: NodePart;

  const setValue = (val: T) => {
    value = val;
    node.setValue(val);
    node.commit();
  };

  return {
    get value() {
      return value;
    },
    set value(newValue) {
      setValue(newValue);
    },
    directive: directive(() => (n: NodePart) => {
      if (node) { return; }
      node = n;
      setValue(value);
    })()
  };
}

const todoCompletedDirective = directive((todo) => (part: NodePart) => {
  if (todo.completed) {
    setTimeout(() => {
      part.setValue('completed');
      part.commit();
      console.log('must change!');
    }, 5000);
    return;
  }
  part.setValue('');
});

const rootTemplate = (context: AppRoot) => html`
<input type="text" @keyup=${context.inputKeyupHandler} .value=${context.titleInputValue}>
<button ?disabled=${!context.titleInputValue} @click=${context.addTodoHandler}>Add Todo</button>
<div>${context.number.directive}</div>
<button @click=${() => { context.number.value = context.number.value + 1 }}>CHANGE!</button>
<ul>
  ${context.todos.map(
  todo =>
    html`<li class=${todoCompletedDirective(todo)} @click=${() => context.todoToggleHandler(todo)}> ${todo.title} ${todo.completed}</li>`)
  }
</ul>
`;

interface ITodo {
  title: string;
  completed: boolean;
}

function Component<T>({ selector, templateFn }: { selector: string, templateFn: (context: T) => TemplateResult }) {
  return function componentDecorator(target: any) {

    console.log(Reflect.getMetadata('design:paramtypes', target));

    class Cmp extends HTMLElement implements IComponent {
      _update: () => void;

      constructor() {
        super();

        target.call(this);

        const root = this.attachShadow({ mode: 'open' });
        let updateScheduled = false;
        this._update = () => {
          if (updateScheduled) { return; }
          updateScheduled = true;

          Promise.resolve().then(() => {
            updateScheduled = false;
            render(templateFn(this as any), root, { eventContext: this });
          })
        };
        this._update();
      }
    }

    const { constructor, ...others } = Object.getOwnPropertyDescriptors(target.prototype);
    Object.defineProperties(Cmp.prototype, others);

    customElements.define(selector, Cmp);
  }
}

function detectChanges(target: any, key: string, descriptor?: TypedPropertyDescriptor<any>): any {
  if (descriptor) {
    const currentMethod = descriptor.value;
    descriptor.value = function (this: IComponent, ...args: any[]) {
      currentMethod(...args);
      if (this._update) { this._update(); }
    }
    return descriptor;
  } else {
    let val: any;
    Object.defineProperty(target, key, {
      set(newValue) {
        val = newValue;
        if (this._update) { this._update(); }
      },
      get() {
        return val;
      }
    });
  }
}

@Component({ selector: 'hg-root', templateFn: rootTemplate })
class AppRoot {

  @detectChanges titleInputValue = '';

  todos: ITodo[] = [];
  number = useState(1000);

  @detectChanges todoToggleHandler(todo: ITodo) {
    todo.completed = !todo.completed;
  }

  inputKeyupHandler(event: KeyboardEvent) {
    const target = event.target as HTMLInputElement;
    this.titleInputValue = target.value;
  }

  addTodoHandler() {
    this.todos = this.todos.concat({ title: this.titleInputValue, completed: false });
    this.titleInputValue = '';
  }

  constructor(private test?: number) {
    this.titleInputValue = '';
  }

  connectedCallback() {
    console.log('Connected!');
  }
}
