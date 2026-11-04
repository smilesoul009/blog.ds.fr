export function crudRoute(controller: Record<string, any>, method: string) {
  const handler = controller[method]
  if (!handler) throw new Error(`Метод "${method}" не определён в контроллере`)
  return handler
}
