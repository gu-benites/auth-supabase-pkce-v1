---
trigger: always_on
---

# Codebase Commenting Guidelines

## Philosophy

Our primary goal for commenting is **clarity and maintainability** throughout the software lifecycle and for every developer. Well-commented code is easier to understand, debug, refactor, and aids in onboarding new team members, significantly reducing cognitive load, especially when revisiting code after some time. In a TypeScript codebase, types already provide significant information about the *what* (e.g., function signatures, data shapes). Therefore, our comments must focus on the **why** (the rationale behind design choices), the **intent** (the overall purpose of a piece of code), and the **complexities** (non-obvious behaviors, edge cases, or algorithms) that aren't immediately evident from the code and types alone.

We use **JSDoc** as the standard format. This provides essential structure, integrates seamlessly with TypeScript's language server for enhanced IntelliSense and static analysis, and offers a consistent, machine-readable format. This consistency benefits human developers and AI-powered development tools, which can leverage these structured comments for better code understanding, automated documentation generation (e.g., via TypeDoc), and more insightful suggestions.

Comments must add significant value. Avoid redundant comments that merely restate what is obvious from the code or duplicate type information already clearly defined in TypeScript. Prioritize commenting public APIs, intricate internal logic, and non-intuitive decisions that future developers (including your future self and colleagues) would otherwise struggle to decipher. Good comments are a hallmark of professional, considerate coding, fostering a more sustainable and collaborative development environment.

## Core Standard: JSDoc

All multi-line comments explaining functions, classes, types, components, hooks, or complex logic blocks **must** use the JSDoc format (`/** ... */`). This adherence to a single standard is crucial for consistency across the entire codebase. JSDoc is chosen for its widespread adoption, excellent integration with the TypeScript ecosystem (enhancing editor IntelliSense, providing type information for static analysis), and its capability to support automated generation of external documentation portals (e.g., using tools like TypeDoc). This ensures comments are not just for inline reading but also contribute actively to a comprehensive, accessible knowledge base about the system.

## When to Comment

Focus commenting efforts where they provide the most value:

1.  *Public APIs / Exports:*
    * *Functions/Methods:* Explain purpose, parameters, return values, and any potential side effects or errors.
    * *React Components:* Describe the component's purpose, its props, and any significant state or behavior. Use `@param` for props.
    * *Custom Hooks:* Explain what the hook does, its parameters, and what it returns.
    * *Utility Functions/Classes:* Document any exported helpers or classes intended for reuse.
    * *Types/Interfaces:* Explain the purpose of complex or broadly used custom types if the name isn't self-explanatory.

2.  *Complex Logic:*
    * If an algorithm, calculation, or piece of business logic is intricate or non-obvious, add comments explaining the approach and the reasoning behind it. Focus on the *why*.

3.  *Non-Obvious Decisions & Trade-offs:*
    * If a particular implementation choice was made for specific reasons (performance, browser compatibility, workaround for a library bug), document it. This provides crucial context for future maintainers.

4.  *Important Constants or Configuration:*
    * If the purpose of a constant isn't immediately clear from its name and value, add a brief explanation.

5.  *Workarounds and `TODO`s:*
    * Use `// HACK:` or `// WORKAROUND:` for temporary fixes, explaining why the workaround is necessary and potentially linking to an issue tracker.
    * Use `// TODO:` for planned improvements or missing features, ideally with context or an issue link.

6.  *Type Clarifications (Sparingly):*
    * In rare cases where TypeScript's inference might be ambiguous or a type needs further semantic meaning, a JSDoc `@type` tag or explanation can help. However, prefer refining the TypeScript types themselves first.

## How to Comment with JSDoc (Essential Tags)

Use clear, concise English. Start block comments with a brief summary sentence.

```typescript
/**
 * [Summary sentence explaining the overall purpose.]
 *
 * [Optional: More detailed explanation, rationale, or context.]
 *
 * @param {Type} name - [Description of the parameter's purpose and expected value.]
 * @param {Type} [optionalName] - [Description for optional parameter. Use brackets.]
 * @param {Type} [nameWithDefault='default'] - [Description for parameter with default.]
 * @param {object} options - Description of the options object.
 * @param {string} options.id - Description of the 'id' property within options.
 * @param {number} [options.count] - Description of optional 'count' property.
 * @returns {ReturnType} - [Description of what the function returns and why/when.]
 * @throws {ErrorType} - [Description of when/why this error might be thrown.]
 * @deprecated [Reason for deprecation and/or alternative to use.]
 * @see {Link/Reference} - [Link to related functions, documentation, or issue tracker.]
 * @example
 * ```typescript
 * // Example usage demonstrates how to call it.
 * const result = myFunction(inputValue);
 * console.log(result);
 * ```
 */
 function myFunction(name: string, options: { id: string; count?: number }): ReturnType {
   // ...implementation
 }

/**
 * Represents a user profile within the application.
 * Used across various UI components and API interactions.
 */
export type UserProfile = {
  /** Unique identifier for the user. */
  id: string;
  /** User's display name. May not be unique. */
  name: string;
  /** Optional email address. */
  email?: string;
};