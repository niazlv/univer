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

import { UnitAction } from '@univerjs/protocol';
import { SubUnitPermissionType } from './type';

export function mapSubEnumToPermissionPoint(permissionEnum: UnitAction): SubUnitPermissionType {
    switch (permissionEnum) {
        case UnitAction.View:
            return SubUnitPermissionType.View;
        case UnitAction.ManageCollaborator:
            return SubUnitPermissionType.ManageCollaborator;
        case UnitAction.Print:
            return SubUnitPermissionType.Print;
        case UnitAction.Comment:
            return SubUnitPermissionType.Comment;
        case UnitAction.Copy:
            return SubUnitPermissionType.Copy;
        case UnitAction.SetWorksheetStyle:
            return SubUnitPermissionType.SetCellStyle;
        case UnitAction.EditWorksheetCell:
            return SubUnitPermissionType.SetCellValue;
        case UnitAction.InsertHyperlink:
            return SubUnitPermissionType.SetHyperLink;
        case UnitAction.Sort:
            return SubUnitPermissionType.Sort;
        case UnitAction.Filter:
            return SubUnitPermissionType.Filter;
        case UnitAction.PivotTable:
            return SubUnitPermissionType.PivotTable;
        case UnitAction.FloatImg:
            return SubUnitPermissionType.FloatImage;
        case UnitAction.RwHgtClWdt:
            return SubUnitPermissionType.RowHeightColWidth;
        case UnitAction.ViemRwHgtClWdt:
            return SubUnitPermissionType.RowHeightColWidthReadonly;
        case UnitAction.ViewFilter:
            return SubUnitPermissionType.FilterReadonly;
        default:
            return SubUnitPermissionType.UnRecognized;
    }
}

export function mapPermissionPointToSubEnum(permissionPoint: SubUnitPermissionType): UnitAction {
    switch (permissionPoint) {
        case SubUnitPermissionType.View:
            return UnitAction.View;
        case SubUnitPermissionType.ManageCollaborator:
            return UnitAction.ManageCollaborator;
        case SubUnitPermissionType.Print:
            return UnitAction.Print;
        case SubUnitPermissionType.Comment:
            return UnitAction.Comment;
        case SubUnitPermissionType.Copy:
            return UnitAction.Copy;
        case SubUnitPermissionType.SetCellStyle:
            return UnitAction.SetWorksheetStyle;
        case SubUnitPermissionType.SetCellValue:
            return UnitAction.EditWorksheetCell;
        case SubUnitPermissionType.SetHyperLink:
            return UnitAction.InsertHyperlink;
        case SubUnitPermissionType.Sort:
            return UnitAction.Sort;
        case SubUnitPermissionType.Filter:
            return UnitAction.Filter;
        case SubUnitPermissionType.PivotTable:
            return UnitAction.PivotTable;
        case SubUnitPermissionType.FloatImage:
            return UnitAction.FloatImg;
        case SubUnitPermissionType.RowHeightColWidth:
            return UnitAction.RwHgtClWdt;
        case SubUnitPermissionType.RowHeightColWidthReadonly:
            return UnitAction.ViemRwHgtClWdt;
        case SubUnitPermissionType.FilterReadonly:
            return UnitAction.ViewFilter;
        default:
            return UnitAction.UNRECOGNIZED;
    }
}

