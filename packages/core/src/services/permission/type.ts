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

import type { Observable } from 'rxjs';
import { createIdentifier } from '@wendellhu/redi';
import type { Nullable } from '../../common/type-utils';
import { LifecycleStages, runOnLifecycle } from '../lifecycle/lifecycle';
import type { IRange } from '../../types/interfaces';

export enum PermissionStatus {
    INIT = 'init',
    FETCHING = 'fetching',
    DONE = 'done',
}

export enum PermissionType {
    WORK_BOOK = 'WORK_BOOK',
    WORK_SHEET = 'WORK_SHEET',
    SHEET_RANGE = 'SHEET_RANGE',
}

// export enum UnitAction {
//     View = 0,
//     Edit = 1,
//     ManageCollaborator = 2,
//     Print = 3,
//     /** Duplicate - create a copy */
//     Duplicate = 4,
//     Comment = 5,
//     Copy = 6,
//     Share = 7,
//     Export = 8,
//     MoveWorksheet = 9,
//     DeleteWorksheet = 10,
//     HideWorksheet = 11,
//     RenameWorksheet = 12,
//     CreateWorksheet = 13,
//     SetWorksheetStyle = 14,
//     EditWorksheetCell = 15,
//     InsertHyperlink = 16,
//     Sort = 17,
//     Filter = 18,
//     PivotTable = 19,
//     FloatImg = 20,
//     History = 21,
//     RwHgtClWdt = 22,
//     ViemRwHgtClWdt = 23,
//     ViewFilter = 24,
//     UNRECOGNIZED = -1,
//   }

export enum UnitPermissionType {
    Edit = 'Edit',
    View = 'View',
    Share = 'Share',
    Comment = 'Comment',
    Duplicate = 'Duplicate',
    Export = 'Export',
    Print = 'Print',
    Copy = 'Copy',
    ProtectSheet = 'ProtectSheet',
    CopySheet = 'CopySheet',
    MoveSheet = 'MoveSheet',
    DeleteSheet = 'DeleteSheet',
    HideSheet = 'HideSheet',
    RenameSheet = 'RenameSheet',
    CreateSheet = 'CreateSheet',
    History = 'History',
    ManageCollaborator = 'ManageCollaborator',
}

export enum SubUnitPermissionType {
    Edit = 'Edit',
    View = 'View',
    Share = 'Share',
    Comment = 'Comment',
    Duplicate = 'Duplicate',
    Export = 'Export',
    Print = 'Print',
    Copy = 'Copy',
    SetCellStyle = 'SetCellStyle',
    SetCellValue = 'SetCellValue',
    SetHyperLink = 'SetHyperLink',
    Sort = 'Sort',
    Filter = 'Filter',
    PivotTable = 'PivotTable',
    FloatImage = 'FloatImage',
    RowHeightColWidth = 'RowHeightColWidth',
    RowHeightColWidthReadonly = 'RowHeightColWidthReadonly',
    FilterReadonly = 'FilterReadonly',
    ManageCollaborator = 'ManageCollaborator',
    UnRecognized = 'UnRecognized',
}

export enum RangeUnitPermissionType {
    Edit = 'Edit',
    View = 'View',
    ManageCollaborator = 'ManageCollaborator',
}
export type IUnitPermissionId = `${PermissionType}.${UnitPermissionType}`;
export type ISubUnitPermissionId = `${PermissionType}.${SubUnitPermissionType}`;
export type IRangePermissionId = `${PermissionType}.${RangeUnitPermissionType}`;

export interface IPermissionPoint<V = boolean> {
    type: PermissionType; // 除了工作簿内置的权限外，其他权限都是动态生成.
    /**
     * ${PermissionType}.${SubUnitPermissionType}_${id}
     */
    id: IUnitPermissionId | ISubUnitPermissionId | IRangePermissionId;
    status: PermissionStatus;
    subType: UnitPermissionType | SubUnitPermissionType;
    value: V;
}

export interface IPermissionParam {
    unitId: string;
    subUnitId: string;
    range?: IRange;
}

export interface IPermissionService {
    permissionPointUpdate$: Observable<IPermissionPoint<unknown>>;
    deletePermissionPoint(permissionId: string): void;
    addPermissionPoint<T = boolean>(permissionPoint: IPermissionPoint<T>): boolean;
    updatePermissionPoint<T = boolean>(permissionId: string, value: T): void;
    getPermissionPoint<T = boolean>(permissionId: string): Nullable<IPermissionPoint<T>>;
    getPermissionPoint$<T = boolean>(permissionId: string): Nullable<Observable<IPermissionPoint<T>>>;

    composePermission$(permissionId: string[]): Observable<IPermissionPoint<unknown>[]>;
    composePermission(permissionId: string[]): IPermissionPoint<unknown>[];
}
// composePermission$(permissionIdList: string[]): Observable<IPermissionPoint[]>;
// composePermission(permissionIdList: string[]): IPermissionPoint[];

export const IPermissionService = createIdentifier<IPermissionService>('univer.permission-service');
runOnLifecycle(LifecycleStages.Starting, IPermissionService);
