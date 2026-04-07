# HealthTrack AI — Workflow

## Development Workflow

### Code Quality Standards
- **Test Coverage**: Minimum 80% code coverage required
  - Unit tests with Vitest
  - Component tests with Testing Library
  - API integration tests with Supertest
  - E2E tests with Playwright for critical user journeys
- **Type Safety**: No `any` types allowed — strict TypeScript mode enforced
- **Linting**: ESLint + Prettier — all commits must pass lint checks
- **Build**: Must compile without errors before merging

### Git Workflow
- **Commit frequency**: Commit changes after every completed task
- **Commit messages**: Conventional Commits format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`)
- **Task summaries**: Use Git Notes for detailed task completion summaries
- **Branch naming**: kebab-case with type prefix (`feat/`, `fix/`, `refactor/`, `chore/`)

### Task Execution Protocol
1. Read the task from `plan.md`
2. Understand requirements and acceptance criteria from `spec.md`
3. Write tests first (TDD approach)
4. Implement the feature to make tests pass
5. Run verification:
   - `npm run test` — all tests pass
   - `npm run lint` — no linting errors
   - `npm run typecheck` — no type errors
   - `npm run build` — build succeeds
6. Update `plan.md` — mark task as complete
7. Commit with descriptive message
8. Update `tracks.md` status

### Code Review Checklist
Before marking any task as complete:
- [ ] Tests written and passing
- [ ] No new TypeScript errors or `any` types
- [ ] No `console.log` statements (use proper logging)
- [ ] Follows TypeScript style guide (`conductor/code_styleguides/typescript.md`)
- [ ] Follows React style guide (`conductor/code_styleguides/react.md`)
- [ ] Matches product guidelines (`conductor/product-guidelines.md`)
- [ ] No hardcoded secrets or credentials
- [ ] Environment variables used for configuration

### Phase Completion Verification
At the end of each phase in the plan:
1. Run full test suite — verify coverage meets 80% threshold
2. Run type checker — zero errors
3. Run linter — zero errors
4. Run build — succeeds without warnings
5. Review all changed files against style guides
6. Update phase status in `tracks.md`
7. Create Git Note with phase summary
