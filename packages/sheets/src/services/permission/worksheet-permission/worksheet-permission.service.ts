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

import type { IPermissionParam, IPermissionPoint, Workbook } from '@univerjs/core';
import { IPermissionService, IResourceManagerService, IUniverInstanceService, LifecycleStages, mapPermissionPointToSubEnum, OnLifecycle, RxDisposable, SubUnitPermissionType, UniverInstanceType } from '@univerjs/core';
import { Inject, Injector } from '@wendellhu/redi';
import { map, takeUntil } from 'rxjs/operators';

// import type { UnitAction, UnitObject } from '@univerjs/protocol';
import { UniverType } from '@univerjs/protocol';
import {
    WorkbookCommentPermission,
    WorkbookCopyPermission,
    WorkbookDuplicatePermission,
    WorkbookEditablePermission,
    WorkbookExportPermission,
    WorkbookManageCollaboratorPermission,
    WorkbookPrintPermission,
    WorkbookSharePermission,
    WorkbookViewPermission,
    WorksheetCommentPermission,
    WorksheetCopyPermission,
    WorksheetDuplicatePermission,
    WorksheetEditablePermission,
    WorksheetExportPermission,
    WorksheetFilterPermission,
    WorksheetFilterReadonlyPermission,
    WorksheetFloatImagePermission,
    WorksheetManageCollaboratorPermission,
    WorksheetPivotTablePermission,
    WorksheetPrintPermission,
    WorksheetRowHeightColWidthPermission,
    WorksheetRowHeightColWidthReadonlyPermission,
    WorksheetSetCellStylePermission,
    WorksheetSetCellValuePermission,
    WorksheetSetHyperLinkPermission,
    WorksheetSharePermission,
    WorksheetSortPermission,
    WorksheetViewPermission,
} from '../permission-point';
import type { GetWorksheetPermission, GetWorksheetPermission$, IObjectModel, SetWorksheetPermission } from '../type';
import { WorksheetProtectionRuleModel } from './worksheet-permission.model';
import { getAllPermissionPoint } from './utils';


export const PLUGIN_NAME = 'SHEET_WORKSHEET_PROTECTION_PLUGIN';

@OnLifecycle(LifecycleStages.Starting, WorksheetPermissionService)
export class WorksheetPermissionService extends RxDisposable {
    getEditPermission$: GetWorksheetPermission$;
    getEditPermission: GetWorksheetPermission;
    setEditPermission: SetWorksheetPermission;

    getPrintPermission$: GetWorksheetPermission$;
    getPrintPermission: GetWorksheetPermission;
    setPrintPermission: SetWorksheetPermission;

    getDuplicatePermission$: GetWorksheetPermission$;
    getDuplicatePermission: GetWorksheetPermission;
    setDuplicatePermission: SetWorksheetPermission;

    getExportPermission$: GetWorksheetPermission$;
    getExportPermission: GetWorksheetPermission;
    setExportPermission: SetWorksheetPermission;

    getSetCellStylePermission$: GetWorksheetPermission$;
    getSetCellStylePermission: GetWorksheetPermission;
    setSetCellStylePermission: SetWorksheetPermission;

    getSetCellValuePermission$: GetWorksheetPermission$;
    getSetCellValuePermission: GetWorksheetPermission;
    setSetCellValuePermission: SetWorksheetPermission;

    getSetHyperLinkPermission$: GetWorksheetPermission$;
    getSetHyperLinkPermission: GetWorksheetPermission;
    setSetHyperLinkPermission: SetWorksheetPermission;

    getSortPermission$: GetWorksheetPermission$;
    getSortPermission: GetWorksheetPermission;
    setSortPermission: SetWorksheetPermission;

    getFilterPermission$: GetWorksheetPermission$;
    getFilterPermission: GetWorksheetPermission;
    setFilterPermission: SetWorksheetPermission;

    getPivotTablePermission$: GetWorksheetPermission$;
    getPivotTablePermission: GetWorksheetPermission;
    setPivotTablePermission: SetWorksheetPermission;

    getFloatImagePermission$: GetWorksheetPermission$;
    getFloatImagePermission: GetWorksheetPermission;
    setFloatImagePermission: SetWorksheetPermission;

    getRowHeightColWidthPermission$: GetWorksheetPermission$;
    getRowHeightColWidthPermission: GetWorksheetPermission;
    setRowHeightColWidthPermission: SetWorksheetPermission;

    getViewPermission$: GetWorksheetPermission$;
    getViewPermission: GetWorksheetPermission;
    setViewPermission: SetWorksheetPermission;

    getSharePermission$: GetWorksheetPermission$;
    getSharePermission: GetWorksheetPermission;
    setSharePermission: SetWorksheetPermission;

    getCommentPermission$: GetWorksheetPermission$;
    getCommentPermission: GetWorksheetPermission;
    setCommentPermission: SetWorksheetPermission;

    getCopyPermission$: GetWorksheetPermission$;
    getCopyPermission: GetWorksheetPermission;
    setCopyPermission: SetWorksheetPermission;

    getRowHeightColWidthReadonlyPermission$: GetWorksheetPermission$;
    getRowHeightColWidthReadonlyPermission: GetWorksheetPermission;
    setRowHeightColWidthReadonlyPermission: SetWorksheetPermission;

    getFilterReadonlyPermission$: GetWorksheetPermission$;
    getFilterReadonlyPermission: GetWorksheetPermission;
    setFilterReadonlyPermission: SetWorksheetPermission;

    getManageCollaboratorPermission$: GetWorksheetPermission$;
    getManageCollaboratorPermission: GetWorksheetPermission;
    setManageCollaboratorPermission: SetWorksheetPermission;

    getUnRecognizedPermission$: GetWorksheetPermission$;
    getUnRecognizedPermission: GetWorksheetPermission;
    setUnRecognizedPermission: SetWorksheetPermission;


    constructor(
        @Inject(IPermissionService) private _permissionService: IPermissionService,
        @Inject(IUniverInstanceService) private _univerInstanceService: IUniverInstanceService,
        @Inject(Injector) readonly _injector: Injector,
        @Inject(WorksheetProtectionRuleModel) private _worksheetProtectionRuleModel: WorksheetProtectionRuleModel,
        @Inject(IResourceManagerService) private _resourceManagerService: IResourceManagerService
    ) {
        super();
        this._init();
        this._initializePermissions();
        this._initRuleChange();
        this._initSnapshot();
    }


    private _init() {
        const handleWorkbook = (workbook: Workbook) => {
            workbook.getSheets().forEach((worksheet) => {
                const workSheetEditPermission = new WorksheetEditablePermission(workbook.getUnitId(), worksheet.getSheetId());
                this._permissionService.addPermissionPoint(workSheetEditPermission);
                const worksheetManageCollaboratorPermission = new WorksheetManageCollaboratorPermission(workbook.getUnitId(), worksheet.getSheetId());
                this._permissionService.addPermissionPoint(worksheetManageCollaboratorPermission);
            });
        };

        this._univerInstanceService.getAllUnitsForType<Workbook>(UniverInstanceType.UNIVER_SHEET).forEach((workbook) => {
            handleWorkbook(workbook);
        });

        this._univerInstanceService.getTypeOfUnitAdded$<Workbook>(UniverInstanceType.UNIVER_SHEET).pipe(takeUntil(this.dispose$)).subscribe(handleWorkbook);

        this._univerInstanceService.getTypeOfUnitDisposed$<Workbook>(UniverInstanceType.UNIVER_SHEET).pipe(takeUntil(this.dispose$)).subscribe((workbook) => {
            workbook.getSheets().forEach((worksheet) => {
                const workSheetPermission = new WorksheetEditablePermission(workbook.getUnitId(), worksheet.getSheetId());
                this._permissionService.deletePermissionPoint(workSheetPermission.id);
                const worksheetManageCollaboratorPermission = new WorksheetManageCollaboratorPermission(workbook.getUnitId(), worksheet.getSheetId());
                this._permissionService.deletePermissionPoint(worksheetManageCollaboratorPermission.id);
            });
        });
    }


    private _createPermissionMethods<T extends IPermissionPoint>(PermissionClassGroup: { WorkbookPermissionClass: new (unitId: string) => T; WorksheetPermissionClass: new (unitId: string, subUnitId: string) => T }) {
        return {
            get$: (permissionParams: IPermissionParam) => {
                const { unitId, subUnitId } = permissionParams;
                const { WorkbookPermissionClass, WorksheetPermissionClass } = PermissionClassGroup;
                const unitPermissionInstance = new WorkbookPermissionClass(unitId);
                const subUnitPermissionInstance = new WorksheetPermissionClass(unitId, subUnitId);
                const workbookPermission = this._permissionService.getPermissionPoint$(unitPermissionInstance.id);
                const sheetPermission = this._permissionService.getPermissionPoint$(subUnitPermissionInstance.id);
                if (!sheetPermission || !workbookPermission) {
                    throw (new Error('Permission initialization error.'));
                }
                return this._permissionService.composePermission$([unitPermissionInstance.id, subUnitPermissionInstance.id]).pipe(map((list) => {
                    return list.every((item) => item.value === true);
                }));
            },
            get: (permissionParams: IPermissionParam) => {
                const { unitId, subUnitId } = permissionParams;
                const { WorkbookPermissionClass, WorksheetPermissionClass } = PermissionClassGroup;
                const workbookPermissionInstance = new WorkbookPermissionClass(unitId);
                const worksheetPermissionInstance = new WorksheetPermissionClass(unitId, subUnitId);
                const workbookPermission = this._permissionService.getPermissionPoint(workbookPermissionInstance.id);
                const sheetPermission = this._permissionService.getPermissionPoint(worksheetPermissionInstance.id);
                if (!sheetPermission || !workbookPermission) {
                    throw (new Error('Permission initialization error.'));
                }
                return workbookPermission.value && sheetPermission.value;
            },
            set: (value: boolean, unitId?: string, subUnitId?: string) => {
                const workbook = this._univerInstanceService.getCurrentUnitForType<Workbook>(UniverInstanceType.UNIVER_SHEET)!;
                if (!workbook) return;
                const _unitId = unitId || workbook.getUnitId();
                const sheet = workbook.getActiveSheet();
                const _subUnitId = subUnitId || sheet.getSheetId();
                const { WorksheetPermissionClass } = PermissionClassGroup;
                const sheetPermission = new WorksheetPermissionClass(_unitId, _subUnitId);
                this._permissionService.updatePermissionPoint(sheetPermission.id, value);
            },
        };
    }

    // eslint-disable-next-line max-lines-per-function
    private _initializePermissions() {
        const permissions = [
            {
                type: SubUnitPermissionType.Edit,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetEditablePermission,
                },
            },
            {
                type: SubUnitPermissionType.Print,
                classGroup: {
                    WorkbookPermissionClass: WorkbookPrintPermission,
                    WorksheetPermissionClass: WorksheetPrintPermission,
                },
            },
            {
                type: SubUnitPermissionType.Duplicate,
                classGroup: {
                    WorkbookPermissionClass: WorkbookDuplicatePermission,
                    WorksheetPermissionClass: WorksheetDuplicatePermission,
                },
            },
            {
                type: SubUnitPermissionType.Export,
                classGroup: {
                    WorkbookPermissionClass: WorkbookExportPermission,
                    WorksheetPermissionClass: WorksheetExportPermission,
                },
            },
            {
                type: SubUnitPermissionType.SetCellStyle,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetSetCellStylePermission,
                },
            },
            {
                type: SubUnitPermissionType.SetCellValue,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetSetCellValuePermission,
                },
            },
            {
                type: SubUnitPermissionType.SetHyperLink,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetSetHyperLinkPermission,
                },
            },
            {
                type: SubUnitPermissionType.Sort,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetSortPermission,
                },
            },
            {
                type: SubUnitPermissionType.Filter,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetFilterPermission,
                },
            },
            {
                type: SubUnitPermissionType.PivotTable,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetPivotTablePermission,
                },
            },
            {
                type: SubUnitPermissionType.FloatImage,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetFloatImagePermission,
                },
            },
            {
                type: SubUnitPermissionType.RowHeightColWidth,
                classGroup: {
                    WorkbookPermissionClass: WorkbookEditablePermission,
                    WorksheetPermissionClass: WorksheetRowHeightColWidthPermission,
                },
            },
            {
                type: SubUnitPermissionType.View,
                classGroup: {
                    WorkbookPermissionClass: WorkbookViewPermission,
                    WorksheetPermissionClass: WorksheetViewPermission,
                },
            },
            {
                type: SubUnitPermissionType.Share,
                classGroup: {
                    WorkbookPermissionClass: WorkbookSharePermission,
                    WorksheetPermissionClass: WorksheetSharePermission,
                },
            },
            {
                type: SubUnitPermissionType.Comment,
                classGroup: {
                    WorkbookPermissionClass: WorkbookCommentPermission,
                    WorksheetPermissionClass: WorksheetCommentPermission,
                },
            },
            {
                type: SubUnitPermissionType.Copy,
                classGroup: {
                    WorkbookPermissionClass: WorkbookCopyPermission,
                    WorksheetPermissionClass: WorksheetCopyPermission,
                },
            },
            {
                type: SubUnitPermissionType.RowHeightColWidthReadonly,
                classGroup: {
                    WorkbookPermissionClass: WorkbookViewPermission,
                    WorksheetPermissionClass: WorksheetRowHeightColWidthReadonlyPermission,
                },
            },
            {
                type: SubUnitPermissionType.FilterReadonly,
                classGroup: {
                    WorkbookPermissionClass: WorkbookViewPermission,
                    WorksheetPermissionClass: WorksheetFilterReadonlyPermission,
                },
            },
            {
                type: SubUnitPermissionType.ManageCollaborator,
                classGroup: {
                    WorkbookPermissionClass: WorkbookManageCollaboratorPermission,
                    WorksheetPermissionClass: WorksheetManageCollaboratorPermission,
                },
            },
        ];

        permissions.forEach(({ type, classGroup }) => {
            const { get$, get, set } = this._createPermissionMethods(classGroup as { WorkbookPermissionClass: new (unitId: string) => IPermissionPoint; WorksheetPermissionClass: new (unitId: string, subUnitId: string) => IPermissionPoint });
            this[`get${type}Permission$`] = get$;
            this[`get${type}Permission`] = get;
            this[`set${type}Permission`] = set;
        });
    }

    private _initRuleChange() {
        this.disposeWithMe(
            this._worksheetProtectionRuleModel.ruleChange$.subscribe((info) => {
                switch (info.type) {
                    case 'add': {
                        getAllPermissionPoint().forEach((F) => {
                            const instance = new F(info.unitId, info.subUnitId);
                            this._permissionService.addPermissionPoint(instance);
                        });
                        break;
                    }
                    case 'delete': {
                        getAllPermissionPoint().forEach((F) => {
                            const instance = new F(info.unitId, info.subUnitId);
                            this._permissionService.deletePermissionPoint(instance.id);
                        });
                        break;
                    }
                    case 'set': {
                        getAllPermissionPoint().forEach((F) => {
                            const instance = new F(info.unitId, info.subUnitId);
                            this._permissionService.updatePermissionPoint(instance.id, info.rule);
                        });
                        break;
                    }
                }
            }));
    }

    private _initSnapshot() {
        const toJson = () => {
            const object = this._worksheetProtectionRuleModel.toObject();
            return JSON.stringify(object);
        };
        const parseJson = (json: string): IObjectModel => {
            if (!json) {
                return {};
            }
            try {
                return JSON.parse(json);
            } catch (err) {
                return {};
            }
        };
        this.disposeWithMe(
            this._resourceManagerService.registerPluginResource({
                toJson, parseJson,
                pluginName: PLUGIN_NAME,
                businesses: [UniverType.UNIVER_SHEET],
                onLoad: (unitId, resources) => {
                    const allAllowedParams: { permissionId: string; unitId: string }[] = [];
                    Object.keys(resources).forEach((subUnitId) => {
                        const rule = resources[subUnitId];
                        allAllowedParams.push({
                            permissionId: rule.permissionId,
                            unitId: rule.unitId,
                        });
                    });
                },
                onUnLoad: () => {
                    this._worksheetProtectionRuleModel.deleteUnitModel();
                },
            })
        );
    }
}
