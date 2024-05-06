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
import { IPermissionService, IResourceManagerService, IUniverInstanceService, LifecycleStages, OnLifecycle, RxDisposable, SubUnitPermissionType, UniverInstanceType } from '@univerjs/core';
import { Inject, Injector } from '@wendellhu/redi';
import { map, takeUntil } from 'rxjs/operators';

import type { Observable } from 'rxjs';
import type { IAllowedRequest } from '@univerjs/protocol';
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
import type { IObjectModel } from '../type';
import { WorksheetProtectionRuleModel } from './worksheet-permission.model';
import { WorksheetPermissionIoService } from './worksheet-permission-io.service';
import { defaultSheetActions } from './type';
import { getAllPermissionPoint } from './utils';

export type getWorksheetPermission$ = (permissionParma: IPermissionParam) => Observable<boolean>;
export type getWorksheetPermission = (permissionParma: IPermissionParam) => boolean;
export type setWorksheetPermission = (value: boolean, unitId?: string, subUnitId?: string) => void;

export const PLUGIN_NAME = 'SHEET_WORKSHEET_PROTECTION_PLUGIN';

@OnLifecycle(LifecycleStages.Starting, WorksheetPermissionService)
export class WorksheetPermissionService extends RxDisposable {
    getEditPermission$: getWorksheetPermission$;
    getEditPermission: getWorksheetPermission;
    setEditPermission: setWorksheetPermission;

    getPrintPermission$: getWorksheetPermission$;
    getPrintPermission: getWorksheetPermission;
    setPrintPermission: setWorksheetPermission;

    getDuplicatePermission$: getWorksheetPermission$;
    getDuplicatePermission: getWorksheetPermission;
    setDuplicatePermission: setWorksheetPermission;

    getExportPermission$: getWorksheetPermission$;
    getExportPermission: getWorksheetPermission;
    setExportPermission: setWorksheetPermission;

    getSetCellStylePermission$: getWorksheetPermission$;
    getSetCellStylePermission: getWorksheetPermission;
    setSetCellStylePermission: setWorksheetPermission;

    getSetCellValuePermission$: getWorksheetPermission$;
    getSetCellValuePermission: getWorksheetPermission;
    setSetCellValuePermission: setWorksheetPermission;

    getSetHyperLinkPermission$: getWorksheetPermission$;
    getSetHyperLinkPermission: getWorksheetPermission;
    setSetHyperLinkPermission: setWorksheetPermission;

    getSortPermission$: getWorksheetPermission$;
    getSortPermission: getWorksheetPermission;
    setSortPermission: setWorksheetPermission;

    getFilterPermission$: getWorksheetPermission$;
    getFilterPermission: getWorksheetPermission;
    setFilterPermission: setWorksheetPermission;

    getPivotTablePermission$: getWorksheetPermission$;
    getPivotTablePermission: getWorksheetPermission;
    setPivotTablePermission: setWorksheetPermission;

    getFloatImagePermission$: getWorksheetPermission$;
    getFloatImagePermission: getWorksheetPermission;
    setFloatImagePermission: setWorksheetPermission;

    getRowHeightColWidthPermission$: getWorksheetPermission$;
    getRowHeightColWidthPermission: getWorksheetPermission;
    setRowHeightColWidthPermission: setWorksheetPermission;

    getViewPermission$: getWorksheetPermission$;
    getViewPermission: getWorksheetPermission;
    setViewPermission: setWorksheetPermission;

    getSharePermission$: getWorksheetPermission$;
    getSharePermission: getWorksheetPermission;
    setSharePermission: setWorksheetPermission;

    getCommentPermission$: getWorksheetPermission$;
    getCommentPermission: getWorksheetPermission;
    setCommentPermission: setWorksheetPermission;

    getCopyPermission$: getWorksheetPermission$;
    getCopyPermission: getWorksheetPermission;
    setCopyPermission: setWorksheetPermission;

    getRowHeightColWidthReadonlyPermission$: getWorksheetPermission$;
    getRowHeightColWidthReadonlyPermission: getWorksheetPermission;
    setRowHeightColWidthReadonlyPermission: setWorksheetPermission;

    getFilterReadonlyPermission$: getWorksheetPermission$;
    getFilterReadonlyPermission: getWorksheetPermission;
    setFilterReadonlyPermission: setWorksheetPermission;

    getManageCollaboratorPermission$: getWorksheetPermission$;
    getManageCollaboratorPermission: getWorksheetPermission;
    setManageCollaboratorPermission: setWorksheetPermission;

    getUnRecognizedPermission$: getWorksheetPermission$;
    getUnRecognizedPermission: getWorksheetPermission;
    setUnRecognizedPermission: setWorksheetPermission;


    constructor(
        @Inject(IPermissionService) private _permissionService: IPermissionService,
        @Inject(IUniverInstanceService) private _univerInstanceService: IUniverInstanceService,
        @Inject(Injector) readonly _injector: Injector,
        @Inject(WorksheetProtectionRuleModel) private _worksheetProtectionRuleModel: WorksheetProtectionRuleModel,
        @Inject(WorksheetPermissionIoService) private _worksheetProtectionIoService: WorksheetPermissionIoService,
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
                if (info.type !== 'delete') {
                    this._worksheetProtectionIoService.allowed({
                        permissionId: info.rule.permissionId,
                        permissionType: info.rule.unitType,
                        unitId: info.unitId,
                        actions: defaultSheetActions,
                    }).then((permissionMap) => {
                        Object.keys(permissionMap).forEach(() => {
                            getAllPermissionPoint().forEach((F) => {
                                const rule = info.rule;
                                const instance = new F(rule.unitId, rule.subUnitId);
                                if (permissionMap[instance.subType] !== undefined) {
                                    this._permissionService.updatePermissionPoint(instance.id, permissionMap[instance.subType]);
                                }
                            });
                        });
                    });
                }

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
                    const allAllowedParams: IAllowedRequest[] = [];
                    Object.keys(resources).forEach((subUnitId) => {
                        const rule = resources[subUnitId];
                        allAllowedParams.push({
                            objectId: rule.permissionId,
                            objectType: rule.unitType,
                            unitId: rule.unitId,
                            actions: defaultSheetActions,
                        });
                    });

                    this._worksheetProtectionIoService.batchAllowed(allAllowedParams).then((permissionMap) => {
                        Object.keys(permissionMap).forEach((permissionId) => {
                            const result = permissionMap[permissionId]; // Record<IPermissionSubType, boolean>
                            getAllPermissionPoint().forEach((F) => {
                                const rule = resources[permissionId];
                                if (rule) {
                                    const instance = new F(unitId, rule.subUnitId);
                                    if (result[instance.subType] !== undefined) {
                                        //  todo 这里统一使用setPermission吗 还是说现在这样就可以
                                        this._permissionService.updatePermissionPoint(instance.id, result[instance.subType]);
                                    }
                                }
                            });
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
