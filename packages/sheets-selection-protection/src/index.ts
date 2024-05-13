/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export { UniverSheetsSelectionProtectionPlugin } from './selection-protection-plugin';

export { SelectionPermissionIoService } from './service';
export { ISelectionPermissionIoService } from './service/selection-permission-io';
export { getAllPermissionPoint, getDefaultPermission } from './service/selection-protection/permission-point';
export { SelectionProtectionRenderService } from './service/selection-protection-render.service'
export { AddSelectionProtection, DeleteSelectionProtection } from './commands';

export type { ISelectionProtectionRule, ICellPermission } from './model';
export { SelectionProtectionRuleModel } from './model';
