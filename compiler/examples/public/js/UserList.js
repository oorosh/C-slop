import { signal, computed, effect } from './signals.js';
import { h, list } from './dom.js';

export function UserList() {
  // State
  const $users = signal([]);
  const $name = signal("");
  const $email = signal("");
  const $loading = signal(true);

  // Effects
  effect(() => {
    fetch(("/api/users")).then(r => r.json()).then(data => { $users.value = data; }).then(() => { $loading.value = false; });
  });

  // Render
  const render = () => {
    return h("div", { class: "container-3cb5" }, [h("h1", null, "User Management"), h("div", null, ["Name: ", $name]), h("form", { class: "form-3cb5" }, [h("input", { value: $name, placeholder: "Name", oninput: (e) => { $name.value = e.target.value; } }, null), h("input", { value: $email, placeholder: "Email", oninput: (e) => { $email.value = e.target.value; } }, null), h("button", { onclick: () => { fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({"name":$name.value,"email":$email.value}) }).then(r => r.json()).then(data => { $users.value = [...$users.value, data]; $name.value = ''; $email.value = ''; }) } }, "Add User")]), $loading.value ? [h("p", null, "Loading...")] : [], list($users, (item, index) => { item.index = index; return [h("div", { class: "card-3cb5" }, [h("div", { class: "user-info-3cb5" }, [h("h3", null, item.name), h("p", null, item.email)]), h("button", { class: "delete-3cb5", onclick: () => { fetch(`/api/users/${item.id}`, { method: 'DELETE' }).then(() => { $users.value = $users.value.filter(x => x.id !== item.id); }) } }, "Delete")])]; })]);
  };

  return render;
}