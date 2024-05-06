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

import { Inject } from '@wendellhu/redi';
import type { IPermissionParam, IPermissionPoint, Workbook } from '@univerjs/core';
import { Disposable, IPermissionService, IUniverInstanceService, LifecycleStages, OnLifecycle, UnitPermissionType, UniverInstanceType } from '@univerjs/core';
import type { Observable } from 'rxjs';
import { map } from 'rxjs';
import { WorkbookCommentPermission, WorkbookCopyPermission, WorkbookCreateSheetPermission, WorkbookDeleteSheetPermission, WorkbookDuplicatePermission, WorkbookEditablePermission, WorkbookExportPermission, WorkbookHideSheetPermission, WorkbookHistoryPermission, WorkbookManageCollaboratorPermission, WorkbookMoveSheetPermission, WorkbookPrintPermission, WorkbookProtectSheetPermission, WorkbookRenameSheetPermission, WorkbookSharePermission, WorkbookViewPermission } from './permission-point';

type getWorkbookPermissionFunc$ = (permissionParma: IPermissionParam) => Observable<boolean>;
type getWorkbookPermissionFunc = (permissionParma: IPermissionParam) => boolean;
type setWorkbookPermissionFunc = (unitId: string, value: boolean) => void;


@OnLifecycle(LifecycleStages.Starting, WorkbookPermissionService)
export class WorkbookPermissionService extends Disposable {
    getEditPermission$: getWorkbookPermissionFunc$;
    getEditPermission: getWorkbookPermissionFunc;
    setEditPermission: setWorkbookPermissionFunc;

    getPrintPermission$: getWorkbookPermissionFunc$;
    getPrintPermission: getWorkbookPermissionFunc;
    setPrintPermission: setWorkbookPermissionFunc;

    getDuplicatePermission$: getWorkbookPermissionFunc$;
    getDuplicatePermission: getWorkbookPermissionFunc;
    setDuplicatePermission: setWorkbookPermissionFunc;

    getExportPermission$: getWorkbookPermissionFunc$;
    getExportPermission: getWorkbookPermissionFunc;
    setExportPermission: setWorkbookPermissionFunc;

    getMoveSheetPermission$: getWorkbookPermissionFunc$;
    getMoveSheetPermission: getWorkbookPermissionFunc;
    setMoveSheetPermission: setWorkbookPermissionFunc;

    getDeleteSheetPermission$: getWorkbookPermissionFunc$;
    getDeleteSheetPermission: getWorkbookPermissionFunc;
    setDeleteSheetPermission: setWorkbookPermissionFunc;

    getHideSheetPermission$: getWorkbookPermissionFunc$;
    getHideSheetPermission: getWorkbookPermissionFunc;
    setHideSheetPermission: setWorkbookPermissionFunc;

    getRenameSheetPermission$: getWorkbookPermissionFunc$;
    getRenameSheetPermission: getWorkbookPermissionFunc;
    setRenameSheetPermission: setWorkbookPermissionFunc;

    getCreateSheetPermission$: getWorkbookPermissionFunc$;
    getCreateSheetPermission: getWorkbookPermissionFunc;
    setCreateSheetPermission: setWorkbookPermissionFunc;

    getHistoryPermission$: getWorkbookPermissionFunc$;
    getHistoryPermission: getWorkbookPermissionFunc;
    setHistoryPermission: setWorkbookPermissionFunc;

    getViewPermission$: getWorkbookPermissionFunc$;
    getViewPermission: getWorkbookPermissionFunc;
    setViewPermission: setWorkbookPermissionFunc;

    getSharePermission$: getWorkbookPermissionFunc$;
    getSharePermission: getWorkbookPermissionFunc;
    setSharePermission: setWorkbookPermissionFunc;

    getCommentPermission$: getWorkbookPermissionFunc$;
    getCommentPermission: getWorkbookPermissionFunc;
    setCommentPermission: setWorkbookPermissionFunc;

    getCopyPermission$: getWorkbookPermissionFunc$;
    getCopyPermission: getWorkbookPermissionFunc;
    setCopyPermission: setWorkbookPermissionFunc;

    getProtectSheetPermission$: getWorkbookPermissionFunc$;
    getProtectSheetPermission: getWorkbookPermissionFunc;
    setProtectSheetPermission: setWorkbookPermissionFunc;

    getCopySheetPermission$: getWorkbookPermissionFunc$;
    getCopySheetPermission: getWorkbookPermissionFunc;
    setCopySheetPermission: setWorkbookPermissionFunc;

    getCollaboratorPermission$: getWorkbookPermissionFunc$;
    getCollaboratorPermission: getWorkbookPermissionFunc;
    setCollaboratorPermission: setWorkbookPermissionFunc;

    getManageCollaboratorPermission$: getWorkbookPermissionFunc$;
    getManageCollaboratorPermission: getWorkbookPermissionFunc;
    setManageCollaboratorPermission: setWorkbookPermissionFunc;

    constructor(
        @Inject(IPermissionService) private _permissionService: IPermissionService,
        @Inject(IUniverInstanceService) private _univerInstanceService: IUniverInstanceService
    ) {
        super();
        this._init();
        this._initializePermissions();
    }

    private _init() {
        const handleWorkbook = (workbook: Workbook) => {
            const univerEditablePermission = new WorkbookEditablePermission(workbook.getUnitId());
            this._permissionService.addPermissionPoint(univerEditablePermission);
            const univerManageCollaboratorPermission = new WorkbookManageCollaboratorPermission(workbook.getUnitId());
            this._permissionService.addPermissionPoint(univerManageCollaboratorPermission);
        };

        this._univerInstanceService.getAllUnitsForType<Workbook>(UniverInstanceType.UNIVER_SHEET).forEach((workbook) => {
            handleWorkbook(workbook);
        });

        this.disposeWithMe(this._univerInstanceService.getTypeOfUnitAdded$<Workbook>(UniverInstanceType.UNIVER_SHEET).subscribe((workbook) => {
            handleWorkbook(workbook);
        }));

        this.disposeWithMe(this._univerInstanceService.getTypeOfUnitDisposed$<Workbook>(UniverInstanceType.UNIVER_SHEET).subscribe((workbook) => {
            const univerEditablePermission = new WorkbookEditablePermission(workbook.getUnitId());
            this._permissionService.deletePermissionPoint(univerEditablePermission.id);
            const univerManageCollaboratorPermission = new WorkbookManageCollaboratorPermission(workbook.getUnitId());
            this._permissionService.deletePermissionPoint(univerManageCollaboratorPermission.id);
        }));
    }

    private _createPermissionMethods<T extends IPermissionPoint>(PermissionClass: new (unitId: string) => T) {
        return {
            get$: (permissionParams: IPermissionParam) => {
                const { unitId } = permissionParams;
                const permissionInstance = new PermissionClass(unitId);
                const permission = this._permissionService.getPermissionPoint(permissionInstance.id);
                if (!permission) {
                    throw (new Error('Permission initialization error.'));
                }
                return this._permissionService.composePermission$([permissionInstance.id]).pipe(map((list) => {
                    return list.every((item) => item.value === true);
                }));
            },
            get: (permissionParams: IPermissionParam) => {
                const { unitId = this._univerInstanceService.getCurrentUnitForType(UniverInstanceType.UNIVER_SHEET)?.getUnitId() } = permissionParams;
                if (!unitId) return false;
                const permissionInstance = new PermissionClass(unitId);
                const permission = this._permissionService.getPermissionPoint(permissionInstance.id);
                return permission?.value ?? false;
            },
            set: (unitId: string, value: boolean) => {
                const permissionInstance = new PermissionClass(unitId);
                this._permissionService.updatePermissionPoint(permissionInstance.id, value);
            },
        };
    }

    private _initializePermissions() {
        const permissions = [
            { type: UnitPermissionType.Edit, class: WorkbookEditablePermission },
            { type: UnitPermissionType.Print, class: WorkbookPrintPermission },
            { type: UnitPermissionType.Duplicate, class: WorkbookDuplicatePermission },
            { type: UnitPermissionType.Export, class: WorkbookExportPermission },
            { type: UnitPermissionType.MoveSheet, class: WorkbookMoveSheetPermission },
            { type: UnitPermissionType.DeleteSheet, class: WorkbookDeleteSheetPermission },
            { type: UnitPermissionType.HideSheet, class: WorkbookHideSheetPermission },
            { type: UnitPermissionType.RenameSheet, class: WorkbookRenameSheetPermission },
            { type: UnitPermissionType.CreateSheet, class: WorkbookCreateSheetPermission },
            { type: UnitPermissionType.History, class: WorkbookHistoryPermission },
            { type: UnitPermissionType.View, class: WorkbookViewPermission },
            { type: UnitPermissionType.Share, class: WorkbookSharePermission },
            { type: UnitPermissionType.Comment, class: WorkbookCommentPermission },
            { type: UnitPermissionType.Copy, class: WorkbookCopyPermission },
            { type: UnitPermissionType.ProtectSheet, class: WorkbookProtectSheetPermission },
            { type: UnitPermissionType.CopySheet, class: WorkbookCopyPermission },
            { type: UnitPermissionType.ManageCollaborator, class: WorkbookManageCollaboratorPermission },
        ];

        permissions.forEach(({ type, class: PermissionClass }) => {
            const { get$, get, set } = this._createPermissionMethods(PermissionClass);
            this[`get${type}Permission$`] = get$;
            this[`get${type}Permission`] = get;
            this[`set${type}Permission`] = set;
        });
    }
}
