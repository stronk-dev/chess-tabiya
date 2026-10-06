// Test-only TypeChecker projection of the real registered interface, never a runtime schema.
import assert from "node:assert/strict";
import { resolve } from "node:path";
import ts from "typescript";

const sourcePath = resolve("packages/runtime/src/assistance.ts");

export function assistanceTypeDomains(sourceText?: string): { readonly version: number; readonly fields: Readonly<Record<string, readonly string[]>> } {
  const options: ts.CompilerOptions = {
    target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, skipLibCheck: true,
    types: [],
  };
  const host = ts.createCompilerHost(options);
  if (sourceText !== undefined) {
    const getSourceFile = host.getSourceFile.bind(host);
    host.getSourceFile = (path, languageVersion, onError, shouldCreateNewSourceFile) => path === sourcePath
      ? ts.createSourceFile(path, sourceText, languageVersion, true)
      : getSourceFile(path, languageVersion, onError, shouldCreateNewSourceFile);
  }
  const program = ts.createProgram([sourcePath], options, host);
  const source = program.getSourceFile(sourcePath)!;
  const declaration = source.statements.find((node): node is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(node) && node.name.text === "AssistanceConfig");
  assert(declaration, "the registered AssistanceConfig interface must exist");
  const checker = program.getTypeChecker();
  const fields: Record<string, readonly string[]> = {};
  let version: number | undefined;
  for (const property of checker.getTypeAtLocation(declaration).getProperties()) {
    const node = property.valueDeclaration!;
    const type = checker.getTypeOfSymbolAtLocation(property, node);
    if (property.name === "version") {
      assert(type.isNumberLiteral(), "the assistance head must be a literal number");
      version = type.value;
      continue;
    }
    const members = type.isUnion() ? type.types : [type];
    const values = members.map((member) => {
      assert(member.isStringLiteral(), `${property.name} must have a closed literal domain`);
      return member.value;
    });
    assert(values.length > 0);
    fields[property.name] = Object.freeze(values.sort());
  }
  assert(version !== undefined && Object.keys(fields).length > 0, "the head and actual fields must both be projected");
  return Object.freeze({ version, fields: Object.freeze(fields) });
}
