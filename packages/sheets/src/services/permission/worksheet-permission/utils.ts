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
import { WorksheetCommentPermission, WorksheetCopyPermission, WorksheetExportPermission, WorksheetFilterPermission, WorksheetFilterReadonlyPermission, WorksheetFloatImagePermission, WorksheetPivotTablePermission, WorksheetPrintPermission, WorksheetRowHeightColWidthPermission, WorksheetRowHeightColWidthReadonlyPermission, WorksheetSetCellStylePermission, WorksheetSetCellValuePermission, WorksheetSetHyperLinkPermission, WorksheetSharePermission, WorksheetSortPermission, WorksheetViewPermission } from '../permission-point';

export const getAllWorksheetPermissionPoint = () => [
    WorksheetPrintPermission,
    WorksheetExportPermission,
    WorksheetSetCellStylePermission,
    WorksheetSetCellValuePermission,
    WorksheetSetHyperLinkPermission,
    WorksheetSortPermission,
    WorksheetFilterPermission,
    WorksheetPivotTablePermission,
    WorksheetFloatImagePermission,
    WorksheetRowHeightColWidthPermission,
    WorksheetViewPermission,
    WorksheetSharePermission,
    WorksheetCommentPermission,
    WorksheetCopyPermission,
    WorksheetRowHeightColWidthReadonlyPermission,
    WorksheetFilterReadonlyPermission,
];

export const defaultWorksheetPermissionPoint = [
    UnitAction.Print,
    UnitAction.Export,
    UnitAction.SetWorksheetStyle,
    UnitAction.EditWorksheetCell,
    UnitAction.InsertHyperlink,
    UnitAction.Sort,
    UnitAction.Filter,
    UnitAction.PivotTable,
    UnitAction.FloatImg,
    UnitAction.RwHgtClWdt,
    UnitAction.View,
    UnitAction.Share,
    UnitAction.Comment,
    UnitAction.Copy,
    UnitAction.ViemRwHgtClWdt,
    UnitAction.ViewFilter,
];

