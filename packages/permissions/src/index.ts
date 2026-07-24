declare const permissionIdentifierBrand: unique symbol;

/** A type boundary only. Permission values and enforcement begin in Phase 3. */
export type PermissionIdentifier = string & {
  readonly [permissionIdentifierBrand]: "PermissionIdentifier";
};
