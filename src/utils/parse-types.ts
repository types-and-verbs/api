import { createSourceFile, ScriptTarget, SyntaxKind as SK } from 'typescript';
import fs from 'fs';
import { Fields, AccessType, Model } from 'types';

/**
 * Object.fromEntries ponyfill
 */
function fromEntries(iterable: any) {
  return [...iterable].reduce(
    (obj, { 0: key, 1: val }) => Object.assign(obj, { [key]: val }),
    {},
  );
}

const validModels = ['Model', 'ModelUser', 'ModelPublic', 'ModelTeam'];

function getAccess(modelType: string): AccessType {
  switch (modelType) {
    case 'ModelTeam':
      return 'TEAM';
    case 'ModelPublic':
      return 'PUBLIC';
    case 'ModelUser':
      return 'USER';
    default:
      return 'USER';
  }
}

export function readAndParse(loc: string) {
  const types = fs.readFileSync(loc, 'utf8');

  return parseTypes(types);
}

export function parseTypes(types: string) {
  const node: any = createSourceFile('x.ts', types, ScriptTarget.Latest);

  const models: Model[] = [];

  node.statements.forEach((s: any) => {
    // TODO look inside ExportNamedDeclaration for InterfaceDeclaration

    // ignore if not a interface declaration
    if (s.kind !== SK.InterfaceDeclaration) return;

    // check if it extends a valid Model
    if (!s.heritageClauses) return;
    const modelType = s.heritageClauses[0].types[0].expression.escapedText;
    if (!validModels.includes(modelType)) return;

    const name = s.name && s.name.escapedText ? s.name.escapedText : null;

    const model = {
      name,
      access: getAccess(modelType),
      fields: {},
    };

    s.members.forEach((n: any): void => {
      const mName = n?.name?.escapedText
        ? (n?.name?.escapedText as string)
        : null;

      // Get type
      const optional = Boolean(n.questionToken);
      let type = getType(n.type.kind);

      let referenceType;
      if (type === 'ref') {
        const typeRef = n.type.typeName.escapedText.toLowerCase();
        if (['email', 'url', 'date'].includes(typeRef)) {
          type = typeRef;
        } else {
          type = 'reference';
          referenceType = n.type.typeName.escapedText;
        }
      }

      let listType;
      if (type === 'array') {
        listType = getType(n.type.elementType.kind);
      }

      const isRef = n.type?.typeName?.escapedText === 'Ref';
      if (isRef) {
        // console.log(JSON.stringify(n, null, 2));
        const typeArguments = n.type?.typeArguments;
        if (typeArguments.length) {
          referenceType = typeArguments[0]?.typeName?.escapedText;
        }
      }

      // console.log(name, optional, type, listType);

      // TODO we should validate whole schema obj here
      if (type) {
        // eslint-disable-next-line
        // @ts-ignore
        model.fields[mName] = {
          type: type.toLowerCase(),
          listType: listType ? listType.toLowerCase() : null,
          referenceType: referenceType ? referenceType.toLowerCase() : null,
          opts: {
            required: !optional,
            // unique?: boolean
            // default?: any
            // enums?: any[]
          },
        };
      }
    });

    models.push(model);
  });

  // console.log(JSON.stringify(models, null, 2));
  return models;
}

function getType(num: number) {
  return (
    fromEntries([
      [SK.TypeReference, 'ref'],
      [SK.ArrayType, 'array'],
      [SK.BooleanKeyword, 'boolean'],
      [SK.NumberKeyword, 'number'],
      [SK.StringKeyword, 'string'],
    ])[num] || undefined
  );
}
