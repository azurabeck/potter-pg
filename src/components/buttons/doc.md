# Button

Botão genérico reutilizável em toda a aplicação.

## Props

| prop        | tipo                                | default     | descrição                                  |
| ----------- | ----------------------------------- | ----------- | ------------------------------------------- |
| `variant`   | `"primary" \| "ghost" \| "icon"`    | `"primary"` | estilo visual do botão                       |
| `active`    | `boolean`                           | `false`     | aplica o estado "selecionado"                |
| `...rest`   | `ButtonHTMLAttributes<HTMLButton>`  | —           | qualquer prop nativa de `<button>`           |

## Exemplo

```tsx
import Button from "@/components/buttons";

<Button variant="ghost" onClick={() => {}}>
  Ano <ChevronDown size={14} />
</Button>
```
