# Snap Remote — Style Guide

Referência visual e de código para manter a consistência do projeto.

---

## Fonte

**Epilogue** (Google Fonts) — usada em todo o projeto.

```html
<link href="https://fonts.googleapis.com/css2?family=Epilogue:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## Cores e Temas

O projeto usa CSS variables com suporte a dark/light mode via `data-theme`.

```css

--bg: #ffffff
--bg-card: #ffffff
--bg-nav: rgba(255, 255, 255, 0.85)
--text-primary: #151515
--text-secondary: hsl(0, 0%, 41%)
--border: #f0f0f0


--bg: #111111
--bg-card: #1e1e1e
--text-primary: #f5f5f5
--text-secondary: #999999
--border: #2a2a2a


--accent: #6c6cff
--accent-light: rgba(108, 108, 255, 0.1)
--green: #4ade80
--yellow: #f5c842
--red: #f87171
```

Para alternar o tema, basta setar o atributo no `<html>`:

```javascript
document.documentElement.setAttribute('data-theme', 'dark')
```

---

## Arquivos CSS

| Arquivo | Responsabilidade |
|---|---|
| `style.css` | Landing page, navbar, hero, variáveis globais, reset |
| `dashboard.css` | Sidebar, topbar, seções do dashboard, cards, modais |
| `auth.css` | Telas de login e cadastro |

---

## Bordas e Sombras

```css
--card-radius: 16px   /* cards principais */
border-radius: 12px   /* botões e inputs */
border-radius: 10px   /* inputs menores */
border-radius: 99px   /* pills e badges */

--shadow: rgba(0, 0, 0, 0.15)   /* light */
--shadow: rgba(0, 0, 0, 0.5)    /* dark */
```

---

## Transições

```css
--transition-fast:   0.2s ease
--transition-smooth: 0.35s cubic-bezier(0.22, 1, 0.36, 1)


transition: background-color 0.4s ease, color 0.4s ease;
```

---

## Botões

```html

<button class="btn-primary">Ação</button>


<button class="btn-submit-modal">Confirmar</button>


<button class="btn-quick-add">+</button>
```

---

## Cards

```html
<div class="dash-card">
  <div class="card-header">
    <h3>Título</h3>
    <button class="card-action">Ver todos</button>
  </div>
</div>
```

---

## Badges e Pills

```html

<span class="tag priority-high">HIGH</span>
<span class="tag priority-medium">MEDIUM</span>
<span class="tag priority-low">LOW</span>

<span class="status-pill focus">Live</span>

<span class="nav-badge red">4</span>
```

---

## Animações

```html
<div class="reveal-up" style="--delay: 0.1s">...</div>

<section class="dash-section active">...</section>
```

---

## Responsividade

| Breakpoint | Comportamento |
|---|---|
| `≤ 1100px` | KPI grid vira 2 colunas, layouts colapsam |
| `≤ 768px` | Sidebar oculta (hamburger), topbar search some |
| `≤ 900px` | Reminders vira coluna única |
| `≤ 1000px` | Todo grid vira coluna única |

---

## Isolamento de dados por usuário

Todas as chaves do `localStorage` usam o e-mail como sufixo:

```
dashboardData_{email}
tasks_{email}
snap-theme_{email}
```