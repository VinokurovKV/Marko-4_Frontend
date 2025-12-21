// TODO: need to refactor
// TODO: problem with several simultaneous refresh-token requests

// Project
import type { SimpleObject } from '@common/simple-object'
import type { Right } from '@common/enums'
import type {
  SubscriptionIdWrapDto,
  SubscriptionIdNullWrapDto
} from '@common/dtos'
import type {
  LoginBodyDto,
  LoginSuccessResultDto,
  LogoutBodyDto,
  RefreshTokensBodyDto,
  RefreshTokensSuccessResultDto
} from '@common/dtos/server-api/auth.dto'
import type {
  ReadMetaSuccessResultDto,
  SetupBodyDto,
  SetupSuccessResultDto
} from '@common/dtos/server-api/common.dto'
import type {
  ReadActionParamsDto,
  ReadActionSuccessResultDto,
  ReadActionInfoParamsDto,
  ReadActionInfoSuccessResultDto,
  ReadActionInfosQueryDto,
  ReadActionInfosSuccessResultItemDto,
  ReadActionInfosCountQueryDto,
  ReadActionInfosCountSuccessResultDto
} from '@common/dtos/server-api/actions.dto'
import type {
  ReadEventsQueryDto,
  ReadEventsSuccessResultItemDto,
  ReadEventsCountQueryDto,
  ReadEventsCountSuccessResultDto
} from '@common/dtos/server-api/events.dto'
import type {
  ReadRoleParamsDto,
  ReadRoleQueryDto,
  ReadRoleWithPrimaryPropsSuccessResultDto,
  ReadRoleWithUpToSecondaryPropsSuccessResultDto,
  ReadRoleWithUpToTertiaryPropsSuccessResultDto,
  ReadRoleWithAllPropsSuccessResultDto,
  ReadRolesQueryDto,
  ReadRolesWithPrimaryPropsSuccessResultItemDto,
  ReadRolesWithUpToSecondaryPropsSuccessResultItemDto,
  ReadRolesCountQueryDto,
  ReadRolesCountSuccessResultDto,
  ReadRoleExistsFlagQueryDto,
  ReadRoleExistsFlagSuccessResultDto,
  ReadRoleVersionParamsDto,
  ReadRoleVersionSuccessResultDto,
  ReadRoleTransitionsParamsDto,
  ReadRoleTransitionsQueryDto,
  ReadRoleTransitionsSuccessResultItemDto,
  ReadRoleTransitionsCountParamsDto,
  ReadRoleTransitionsCountQueryDto,
  ReadRoleTransitionsCountSuccessResultDto,
  CreateRoleBodyDto,
  CreateRoleSuccessResultDto,
  UpdateRoleBodyDto,
  UpdateRoleSuccessResultDto,
  DeleteRoleUnsafeBodyDto,
  DeleteRoleUnsafeSuccessResultDto,
  DeleteRoleBodyDto,
  DeleteRoleSuccessResultDto,
  DeleteRolesUnsafeBodyDto,
  DeleteRolesUnsafeSuccessResultDto,
  DeleteRolesBodyDto,
  DeleteRolesSuccessResultDto
} from '@common/dtos/server-api/roles.dto'
import type {
  CreateUserBodyDto,
  CreateUserSuccessResultDto,
  DeleteUserBodyDto,
  DeleteUserSuccessResultDto,
  DeleteUsersBodyDto,
  DeleteUsersSuccessResultDto,
  ReadSelfMetaSuccessResultDto,
  ReadUserExistsFlagQueryDto,
  ReadUserExistsFlagSuccessResultDto,
  ReadUserParamsDto,
  ReadUserQueryDto,
  ReadUserTransitionsCountParamsDto,
  ReadUserTransitionsCountQueryDto,
  ReadUserTransitionsCountSuccessResultDto,
  ReadUserTransitionsParamsDto,
  ReadUserTransitionsQueryDto,
  ReadUserTransitionsSuccessResultItemDto,
  ReadUserVersionParamsDto,
  ReadUserVersionSuccessResultDto,
  ReadUserWithAllPropsSuccessResultDto,
  ReadUserWithPrimaryPropsSuccessResultDto,
  ReadUserWithUpToSecondaryPropsSuccessResultDto,
  ReadUserWithUpToTertiaryPropsSuccessResultDto,
  ReadUsersCountQueryDto,
  ReadUsersCountSuccessResultDto,
  ReadUsersQueryDto,
  ReadUsersWithPrimaryPropsSuccessResultItemDto,
  ReadUsersWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateUserBodyDto,
  UpdateUserPassBodyDto,
  UpdateUserPassSuccessResultDto,
  UpdateUserSuccessResultDto
} from '@common/dtos/server-api/users.dto'
import type {
  CreateTagBodyDto,
  CreateTagSuccessResultDto,
  DeleteTagBodyDto,
  DeleteTagSuccessResultDto,
  DeleteTagsBodyDto,
  DeleteTagsSuccessResultDto,
  ReadTagExistsFlagQueryDto,
  ReadTagExistsFlagSuccessResultDto,
  ReadTagParamsDto,
  ReadTagQueryDto,
  ReadTagTransitionsCountParamsDto,
  ReadTagTransitionsCountQueryDto,
  ReadTagTransitionsCountSuccessResultDto,
  ReadTagTransitionsParamsDto,
  ReadTagTransitionsQueryDto,
  ReadTagTransitionsSuccessResultItemDto,
  ReadTagVersionParamsDto,
  ReadTagVersionSuccessResultDto,
  ReadTagWithAllPropsSuccessResultDto,
  ReadTagWithPrimaryPropsSuccessResultDto,
  ReadTagWithUpToSecondaryPropsSuccessResultDto,
  ReadTagWithUpToTertiaryPropsSuccessResultDto,
  ReadTagsCountQueryDto,
  ReadTagsCountSuccessResultDto,
  ReadTagsQueryDto,
  ReadTagsWithPrimaryPropsSuccessResultItemDto,
  ReadTagsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateTagBodyDto,
  UpdateTagSuccessResultDto
} from '@common/dtos/server-api/tags.dto'
import type {
  CreateDocumentBodyMainDto,
  CreateDocumentSuccessResultDto,
  DeleteDocumentBodyDto,
  DeleteDocumentSuccessResultDto,
  DeleteDocumentUnsafeBodyDto,
  DeleteDocumentUnsafeSuccessResultDto,
  DeleteDocumentsBodyDto,
  DeleteDocumentsSuccessResultDto,
  DeleteDocumentsUnsafeBodyDto,
  DeleteDocumentsUnsafeSuccessResultDto,
  ReadDocumentConfigParamsDto,
  ReadDocumentExistsFlagQueryDto,
  ReadDocumentExistsFlagSuccessResultDto,
  ReadDocumentParamsDto,
  ReadDocumentQueryDto,
  ReadDocumentTransitionsCountParamsDto,
  ReadDocumentTransitionsCountQueryDto,
  ReadDocumentTransitionsCountSuccessResultDto,
  ReadDocumentTransitionsParamsDto,
  ReadDocumentTransitionsQueryDto,
  ReadDocumentTransitionsSuccessResultItemDto,
  ReadDocumentVersionConfigParamsDto,
  ReadDocumentVersionParamsDto,
  ReadDocumentVersionSuccessResultDto,
  ReadDocumentWithAllPropsSuccessResultDto,
  ReadDocumentWithPrimaryPropsSuccessResultDto,
  ReadDocumentWithUpToSecondaryPropsSuccessResultDto,
  ReadDocumentWithUpToTertiaryPropsSuccessResultDto,
  ReadDocumentsCountQueryDto,
  ReadDocumentsCountSuccessResultDto,
  ReadDocumentsQueryDto,
  ReadDocumentsWithPrimaryPropsSuccessResultItemDto,
  ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateDocumentBodyDto,
  UpdateDocumentSuccessResultDto
} from '@common/dtos/server-api/documents.dto'
import type {
  CreateFragmentBodyDto,
  CreateFragmentSuccessResultDto,
  DeleteFragmentBodyDto,
  DeleteFragmentSuccessResultDto,
  DeleteFragmentsBodyDto,
  DeleteFragmentsSuccessResultDto,
  ReadFragmentConfigParamsDto,
  ReadFragmentExistsFlagQueryDto,
  ReadFragmentExistsFlagSuccessResultDto,
  ReadFragmentParamsDto,
  ReadFragmentQueryDto,
  ReadFragmentTransitionsCountParamsDto,
  ReadFragmentTransitionsCountQueryDto,
  ReadFragmentTransitionsCountSuccessResultDto,
  ReadFragmentTransitionsParamsDto,
  ReadFragmentTransitionsQueryDto,
  ReadFragmentTransitionsSuccessResultItemDto,
  ReadFragmentVersionConfigParamsDto,
  ReadFragmentVersionParamsDto,
  ReadFragmentVersionSuccessResultDto,
  ReadFragmentWithAllPropsSuccessResultDto,
  ReadFragmentWithPrimaryPropsSuccessResultDto,
  ReadFragmentWithUpToSecondaryPropsSuccessResultDto,
  ReadFragmentWithUpToTertiaryPropsSuccessResultDto,
  ReadFragmentsCountQueryDto,
  ReadFragmentsCountSuccessResultDto,
  ReadFragmentsQueryDto,
  ReadFragmentsWithPrimaryPropsSuccessResultItemDto,
  ReadFragmentsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateFragmentBodyDto,
  UpdateFragmentSuccessResultDto
} from '@common/dtos/server-api/fragments.dto'
import type {
  CreateRequirementBodyDto,
  CreateRequirementSuccessResultDto,
  DeleteRequirementBodyDto,
  DeleteRequirementSuccessResultDto,
  DeleteRequirementsBodyDto,
  DeleteRequirementsSuccessResultDto,
  ReadRequirementExistsFlagQueryDto,
  ReadRequirementExistsFlagSuccessResultDto,
  ReadRequirementParamsDto,
  ReadRequirementQueryDto,
  ReadRequirementTransitionsCountParamsDto,
  ReadRequirementTransitionsCountQueryDto,
  ReadRequirementTransitionsCountSuccessResultDto,
  ReadRequirementTransitionsParamsDto,
  ReadRequirementTransitionsQueryDto,
  ReadRequirementTransitionsSuccessResultItemDto,
  ReadRequirementVersionParamsDto,
  ReadRequirementVersionSuccessResultDto,
  ReadRequirementWithAllPropsSuccessResultDto,
  ReadRequirementWithPrimaryPropsSuccessResultDto,
  ReadRequirementWithUpToSecondaryPropsSuccessResultDto,
  ReadRequirementWithUpToTertiaryPropsSuccessResultDto,
  ReadRequirementsCountQueryDto,
  ReadRequirementsCountSuccessResultDto,
  ReadRequirementsHierarchySuccessResultDto,
  ReadRequirementsHierarchyVertexParamsDto,
  ReadRequirementsHierarchyVertexSuccessResultDto,
  ReadRequirementsQueryDto,
  ReadRequirementsWithPrimaryPropsSuccessResultItemDto,
  ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateRequirementBodyDto,
  UpdateRequirementSuccessResultDto
} from '@common/dtos/server-api/requirements.dto'
import type {
  CreateCoverageBodyDto,
  CreateCoverageSuccessResultDto,
  DeleteCoverageBodyDto,
  DeleteCoverageSuccessResultDto,
  DeleteCoveragesBodyDto,
  DeleteCoveragesSuccessResultDto,
  ReadCoverageExistsFlagQueryDto,
  ReadCoverageExistsFlagSuccessResultDto,
  ReadCoverageParamsDto,
  ReadCoverageQueryDto,
  ReadCoverageTransitionsCountParamsDto,
  ReadCoverageTransitionsCountQueryDto,
  ReadCoverageTransitionsCountSuccessResultDto,
  ReadCoverageTransitionsParamsDto,
  ReadCoverageTransitionsQueryDto,
  ReadCoverageTransitionsSuccessResultItemDto,
  ReadCoverageVersionParamsDto,
  ReadCoverageVersionSuccessResultDto,
  ReadCoverageWithAllPropsSuccessResultDto,
  ReadCoverageWithPrimaryPropsSuccessResultDto,
  ReadCoverageWithUpToSecondaryPropsSuccessResultDto,
  ReadCoverageWithUpToTertiaryPropsSuccessResultDto,
  ReadCoveragesCountQueryDto,
  ReadCoveragesCountSuccessResultDto,
  ReadCoveragesQueryDto,
  ReadCoveragesWithPrimaryPropsSuccessResultItemDto,
  ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateCoverageBodyDto,
  UpdateCoverageSuccessResultDto
} from '@common/dtos/server-api/coverages.dto'
import type {
  CreateCommonTopologyBodyDto,
  CreateCommonTopologySuccessResultDto,
  DeleteCommonTopologyBodyDto,
  DeleteCommonTopologySuccessResultDto,
  DeleteCommonTopologyUnsafeBodyDto,
  DeleteCommonTopologyUnsafeSuccessResultDto,
  DeleteCommonTopologiesBodyDto,
  DeleteCommonTopologiesSuccessResultDto,
  DeleteCommonTopologiesUnsafeBodyDto,
  DeleteCommonTopologiesUnsafeSuccessResultDto,
  ReadCommonTopologyExistsFlagQueryDto,
  ReadCommonTopologyExistsFlagSuccessResultDto,
  ReadCommonTopologyParamsDto,
  ReadCommonTopologyQueryDto,
  ReadCommonTopologyTransitionsCountParamsDto,
  ReadCommonTopologyTransitionsCountQueryDto,
  ReadCommonTopologyTransitionsCountSuccessResultDto,
  ReadCommonTopologyTransitionsParamsDto,
  ReadCommonTopologyTransitionsQueryDto,
  ReadCommonTopologyTransitionsSuccessResultItemDto,
  ReadCommonTopologyVersionParamsDto,
  ReadCommonTopologyVersionSuccessResultDto,
  ReadCommonTopologyWithAllPropsSuccessResultDto,
  ReadCommonTopologyWithPrimaryPropsSuccessResultDto,
  ReadCommonTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadCommonTopologiesCountQueryDto,
  ReadCommonTopologiesCountSuccessResultDto,
  ReadCommonTopologiesQueryDto,
  ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto,
  ReadCommonTopologiesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateCommonTopologyBodyDto,
  UpdateCommonTopologySuccessResultDto
} from '@common/dtos/server-api/common-topologies.dto'
import type {
  CreateTopologyBodyDto,
  CreateTopologySuccessResultDto,
  DeleteTopologyBodyDto,
  DeleteTopologySuccessResultDto,
  DeleteTopologiesBodyDto,
  DeleteTopologiesSuccessResultDto,
  ReadTopologyExistsFlagQueryDto,
  ReadTopologyExistsFlagSuccessResultDto,
  ReadTopologyParamsDto,
  ReadTopologyQueryDto,
  ReadTopologyTransitionsCountParamsDto,
  ReadTopologyTransitionsCountQueryDto,
  ReadTopologyTransitionsCountSuccessResultDto,
  ReadTopologyTransitionsParamsDto,
  ReadTopologyTransitionsQueryDto,
  ReadTopologyTransitionsSuccessResultItemDto,
  ReadTopologyVersionParamsDto,
  ReadTopologyVersionSuccessResultDto,
  ReadTopologyWithAllPropsSuccessResultDto,
  ReadTopologyWithPrimaryPropsSuccessResultDto,
  ReadTopologyWithUpToSecondaryPropsSuccessResultDto,
  ReadTopologyWithUpToTertiaryPropsSuccessResultDto,
  ReadTopologiesCountQueryDto,
  ReadTopologiesCountSuccessResultDto,
  ReadTopologiesQueryDto,
  ReadTopologiesWithPrimaryPropsSuccessResultItemDto,
  ReadTopologiesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateTopologyBodyDto,
  UpdateTopologySuccessResultDto
} from '@common/dtos/server-api/topologies.dto'
import type {
  CreateDsefBodyMainDto,
  CreateDsefSuccessResultDto,
  DeleteDsefBodyDto,
  DeleteDsefSuccessResultDto,
  DeleteDsefsBodyDto,
  DeleteDsefsSuccessResultDto,
  ReadDsefAdapterParamsDto,
  ReadDsefExistsFlagQueryDto,
  ReadDsefExistsFlagSuccessResultDto,
  ReadDsefNoAdapterConfigParamsDto,
  ReadDsefParamsDto,
  ReadDsefQueryDto,
  ReadDsefTransitionsCountParamsDto,
  ReadDsefTransitionsCountQueryDto,
  ReadDsefTransitionsCountSuccessResultDto,
  ReadDsefTransitionsParamsDto,
  ReadDsefTransitionsQueryDto,
  ReadDsefTransitionsSuccessResultItemDto,
  ReadDsefVersionAdapterParamsDto,
  ReadDsefVersionNoAdapterConfigParamsDto,
  ReadDsefVersionParamsDto,
  ReadDsefVersionSuccessResultDto,
  ReadDsefWithAllPropsSuccessResultDto,
  ReadDsefWithPrimaryPropsSuccessResultDto,
  ReadDsefWithUpToSecondaryPropsSuccessResultDto,
  ReadDsefWithUpToTertiaryPropsSuccessResultDto,
  ReadDsefsCountQueryDto,
  ReadDsefsCountSuccessResultDto,
  ReadDsefsQueryDto,
  ReadDsefsWithPrimaryPropsSuccessResultItemDto,
  ReadDsefsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateDsefBodyMainDto,
  UpdateDsefSuccessResultDto
} from '@common/dtos/server-api/dsefs.dto'
import type {
  CreateDbcBodyMainDto,
  CreateDbcSuccessResultDto,
  DeleteDbcBodyDto,
  DeleteDbcSuccessResultDto,
  DeleteDbcsBodyDto,
  DeleteDbcsSuccessResultDto,
  ReadDbcConfigParamsDto,
  ReadDbcDsefConfigParamsDto,
  ReadDbcExistsFlagQueryDto,
  ReadDbcExistsFlagSuccessResultDto,
  ReadDbcParamsDto,
  ReadDbcQueryDto,
  ReadDbcTransitionsCountParamsDto,
  ReadDbcTransitionsCountQueryDto,
  ReadDbcTransitionsCountSuccessResultDto,
  ReadDbcTransitionsParamsDto,
  ReadDbcTransitionsQueryDto,
  ReadDbcTransitionsSuccessResultItemDto,
  ReadDbcVersionConfigParamsDto,
  ReadDbcVersionDsefConfigParamsDto,
  ReadDbcVersionParamsDto,
  ReadDbcVersionSuccessResultDto,
  ReadDbcWithAllPropsSuccessResultDto,
  ReadDbcWithPrimaryPropsSuccessResultDto,
  ReadDbcWithUpToSecondaryPropsSuccessResultDto,
  ReadDbcWithUpToTertiaryPropsSuccessResultDto,
  ReadDbcsCountQueryDto,
  ReadDbcsCountSuccessResultDto,
  ReadDbcsQueryDto,
  ReadDbcsWithPrimaryPropsSuccessResultItemDto,
  ReadDbcsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateDbcBodyMainDto,
  UpdateDbcSuccessResultDto
} from '@common/dtos/server-api/dbcs.dto'
import type {
  CreateTestTemplateBodyMainDto,
  CreateTestTemplateSuccessResultDto,
  DeleteTestTemplateBodyDto,
  DeleteTestTemplateSuccessResultDto,
  DeleteTestTemplatesBodyDto,
  DeleteTestTemplatesSuccessResultDto,
  ReadTestTemplateConfigParamsDto,
  ReadTestTemplateExistsFlagQueryDto,
  ReadTestTemplateExistsFlagSuccessResultDto,
  ReadTestTemplateParamsDto,
  ReadTestTemplateQueryDto,
  ReadTestTemplateTransitionsCountParamsDto,
  ReadTestTemplateTransitionsCountQueryDto,
  ReadTestTemplateTransitionsCountSuccessResultDto,
  ReadTestTemplateTransitionsParamsDto,
  ReadTestTemplateTransitionsQueryDto,
  ReadTestTemplateTransitionsSuccessResultItemDto,
  ReadTestTemplateVersionConfigParamsDto,
  ReadTestTemplateVersionParamsDto,
  ReadTestTemplateVersionSuccessResultDto,
  ReadTestTemplateWithAllPropsSuccessResultDto,
  ReadTestTemplateWithPrimaryPropsSuccessResultDto,
  ReadTestTemplateWithUpToSecondaryPropsSuccessResultDto,
  ReadTestTemplateWithUpToTertiaryPropsSuccessResultDto,
  ReadTestTemplatesCountQueryDto,
  ReadTestTemplatesCountSuccessResultDto,
  ReadTestTemplatesQueryDto,
  ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto,
  ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateTestTemplateBodyMainDto,
  UpdateTestTemplateSuccessResultDto
} from '@common/dtos/server-api/test-templates.dto'
import type {
  CreateTestBodyMainDto,
  CreateTestSuccessResultDto,
  DeleteTestBodyDto,
  DeleteTestSuccessResultDto,
  DeleteTestsBodyDto,
  DeleteTestsSuccessResultDto,
  ReadTestConfigParamsDto,
  ReadTestDeltaDsefConfigParamsDto,
  ReadTestDeltaParamsDto,
  ReadTestExistsFlagQueryDto,
  ReadTestExistsFlagSuccessResultDto,
  ReadTestParamsDto,
  ReadTestQueryDto,
  ReadTestTransitionsCountParamsDto,
  ReadTestTransitionsCountQueryDto,
  ReadTestTransitionsCountSuccessResultDto,
  ReadTestTransitionsParamsDto,
  ReadTestTransitionsQueryDto,
  ReadTestTransitionsSuccessResultItemDto,
  ReadTestVersionConfigParamsDto,
  ReadTestVersionDeltaDsefConfigParamsDto,
  ReadTestVersionDeltaParamsDto,
  ReadTestVersionParamsDto,
  ReadTestVersionSuccessResultDto,
  ReadTestWithAllPropsSuccessResultDto,
  ReadTestWithPrimaryPropsSuccessResultDto,
  ReadTestWithUpToSecondaryPropsSuccessResultDto,
  ReadTestWithUpToTertiaryPropsSuccessResultDto,
  ReadTestsCountQueryDto,
  ReadTestsCountSuccessResultDto,
  ReadTestsQueryDto,
  ReadTestsWithPrimaryPropsSuccessResultItemDto,
  ReadTestsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateTestBodyMainDto,
  UpdateTestSuccessResultDto
} from '@common/dtos/server-api/tests.dto'
import type {
  CreateSubgroupBodyDto,
  CreateSubgroupSuccessResultDto,
  DeleteSubgroupBodyDto,
  DeleteSubgroupSuccessResultDto,
  DeleteSubgroupsBodyDto,
  DeleteSubgroupsSuccessResultDto,
  ReadSubgroupExistsFlagQueryDto,
  ReadSubgroupExistsFlagSuccessResultDto,
  ReadSubgroupParamsDto,
  ReadSubgroupQueryDto,
  ReadSubgroupTransitionsCountParamsDto,
  ReadSubgroupTransitionsCountQueryDto,
  ReadSubgroupTransitionsCountSuccessResultDto,
  ReadSubgroupTransitionsParamsDto,
  ReadSubgroupTransitionsQueryDto,
  ReadSubgroupTransitionsSuccessResultItemDto,
  ReadSubgroupVersionParamsDto,
  ReadSubgroupVersionSuccessResultDto,
  ReadSubgroupWithAllPropsSuccessResultDto,
  ReadSubgroupWithPrimaryPropsSuccessResultDto,
  ReadSubgroupWithUpToSecondaryPropsSuccessResultDto,
  ReadSubgroupWithUpToTertiaryPropsSuccessResultDto,
  ReadSubgroupsCountQueryDto,
  ReadSubgroupsCountSuccessResultDto,
  ReadSubgroupsQueryDto,
  ReadSubgroupsWithPrimaryPropsSuccessResultItemDto,
  ReadSubgroupsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateSubgroupBodyDto,
  UpdateSubgroupSuccessResultDto
} from '@common/dtos/server-api/subgroups.dto'
import type {
  CreateGroupBodyDto,
  CreateGroupSuccessResultDto,
  DeleteGroupBodyDto,
  DeleteGroupSuccessResultDto,
  DeleteGroupsBodyDto,
  DeleteGroupsSuccessResultDto,
  ReadGroupExistsFlagQueryDto,
  ReadGroupExistsFlagSuccessResultDto,
  ReadGroupParamsDto,
  ReadGroupQueryDto,
  ReadGroupTransitionsCountParamsDto,
  ReadGroupTransitionsCountQueryDto,
  ReadGroupTransitionsCountSuccessResultDto,
  ReadGroupTransitionsParamsDto,
  ReadGroupTransitionsQueryDto,
  ReadGroupTransitionsSuccessResultItemDto,
  ReadGroupVersionParamsDto,
  ReadGroupVersionSuccessResultDto,
  ReadGroupWithAllPropsSuccessResultDto,
  ReadGroupWithPrimaryPropsSuccessResultDto,
  ReadGroupWithUpToSecondaryPropsSuccessResultDto,
  ReadGroupWithUpToTertiaryPropsSuccessResultDto,
  ReadGroupsCountQueryDto,
  ReadGroupsCountSuccessResultDto,
  ReadGroupsQueryDto,
  ReadGroupsWithPrimaryPropsSuccessResultItemDto,
  ReadGroupsWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateGroupBodyDto,
  UpdateGroupSuccessResultDto
} from '@common/dtos/server-api/groups.dto'
import type {
  CreateDeviceBodyMainDto,
  CreateDeviceSuccessResultDto,
  DeleteDeviceBodyDto,
  DeleteDeviceSuccessResultDto,
  DeleteDevicesBodyDto,
  DeleteDevicesSuccessResultDto,
  ReadDeviceAccessConfigParamsDto,
  ReadDeviceClearConfigParamsDto,
  ReadDeviceConfigParamsDto,
  ReadDeviceDsefAccessConfigParamsDto,
  ReadDeviceDsefClearConfigParamsDto,
  ReadDeviceExistsFlagQueryDto,
  ReadDeviceExistsFlagSuccessResultDto,
  ReadDeviceParamsDto,
  ReadDeviceQueryDto,
  ReadDeviceTransitionsCountParamsDto,
  ReadDeviceTransitionsCountQueryDto,
  ReadDeviceTransitionsCountSuccessResultDto,
  ReadDeviceTransitionsParamsDto,
  ReadDeviceTransitionsQueryDto,
  ReadDeviceTransitionsSuccessResultItemDto,
  ReadDeviceVersionAccessConfigParamsDto,
  ReadDeviceVersionClearConfigParamsDto,
  ReadDeviceVersionConfigParamsDto,
  ReadDeviceVersionDsefAccessConfigParamsDto,
  ReadDeviceVersionDsefClearConfigParamsDto,
  ReadDeviceVersionParamsDto,
  ReadDeviceVersionSuccessResultDto,
  ReadDeviceWithAllPropsSuccessResultDto,
  ReadDeviceWithPrimaryPropsSuccessResultDto,
  ReadDeviceWithUpToSecondaryPropsSuccessResultDto,
  ReadDeviceWithUpToTertiaryPropsSuccessResultDto,
  ReadDevicesCountQueryDto,
  ReadDevicesCountSuccessResultDto,
  ReadDevicesQueryDto,
  ReadDevicesWithPrimaryPropsSuccessResultItemDto,
  ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateDeviceBodyMainDto,
  UpdateDeviceSuccessResultDto
} from '@common/dtos/server-api/devices.dto'
import type {
  AbortTaskBodyDto,
  AbortTaskSuccessResultDto,
  CancelTaskBodyDto,
  CancelTaskSuccessResultDto,
  CreateTaskBodyDto,
  CreateTaskSuccessResultDto,
  DeleteTaskBodyDto,
  DeleteTaskSuccessResultDto,
  DeleteTasksBodyDto,
  DeleteTasksSuccessResultDto,
  PauseTaskBodyDto,
  PauseTaskSuccessResultDto,
  ReadTaskParamsDto,
  ReadTaskQueryDto,
  ReadTaskTransitionsCountParamsDto,
  ReadTaskTransitionsCountQueryDto,
  ReadTaskTransitionsCountSuccessResultDto,
  ReadTaskTransitionsParamsDto,
  ReadTaskTransitionsQueryDto,
  ReadTaskTransitionsSuccessResultItemDto,
  ReadTaskVersionParamsDto,
  ReadTaskVersionSuccessResultDto,
  ReadTaskWithAllPropsSuccessResultDto,
  ReadTaskWithChangeableAllPropsSuccessResultDto,
  ReadTaskWithChangeablePrimaryPropsSuccessResultDto,
  ReadTaskWithChangeableUpToSecondaryPropsSuccessResultDto,
  ReadTaskWithChangeableUpToTertiaryPropsSuccessResultDto,
  ReadTaskWithPrimaryPropsSuccessResultDto,
  ReadTaskWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskWithUpToTertiaryPropsSuccessResultDto,
  ReadTasksCountQueryDto,
  ReadTasksCountSuccessResultDto,
  ReadTasksQueryDto,
  ReadTasksWithPrimaryPropsSuccessResultItemDto,
  ReadTasksWithUpToSecondaryPropsSuccessResultItemDto,
  UnpauseTaskBodyDto,
  UnpauseTaskSuccessResultDto,
  UpdateTaskBodyDto,
  UpdateTaskSuccessResultDto
} from '@common/dtos/server-api/tasks.dto'
import type {
  CreateTaskTemplateBodyDto,
  CreateTaskTemplateSuccessResultDto,
  DeleteTaskTemplateBodyDto,
  DeleteTaskTemplateSuccessResultDto,
  DeleteTaskTemplatesBodyDto,
  DeleteTaskTemplatesSuccessResultDto,
  ReadTaskTemplateExistsFlagQueryDto,
  ReadTaskTemplateExistsFlagSuccessResultDto,
  ReadTaskTemplateParamsDto,
  ReadTaskTemplateQueryDto,
  ReadTaskTemplateTransitionsCountParamsDto,
  ReadTaskTemplateTransitionsCountQueryDto,
  ReadTaskTemplateTransitionsCountSuccessResultDto,
  ReadTaskTemplateTransitionsParamsDto,
  ReadTaskTemplateTransitionsQueryDto,
  ReadTaskTemplateTransitionsSuccessResultItemDto,
  ReadTaskTemplateVersionParamsDto,
  ReadTaskTemplateVersionSuccessResultDto,
  ReadTaskTemplateWithAllPropsSuccessResultDto,
  ReadTaskTemplateWithPrimaryPropsSuccessResultDto,
  ReadTaskTemplateWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskTemplateWithUpToTertiaryPropsSuccessResultDto,
  ReadTaskTemplatesCountQueryDto,
  ReadTaskTemplatesCountSuccessResultDto,
  ReadTaskTemplatesQueryDto,
  ReadTaskTemplatesWithPrimaryPropsSuccessResultItemDto,
  ReadTaskTemplatesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateTaskTemplateBodyDto,
  UpdateTaskTemplateSuccessResultDto
} from '@common/dtos/server-api/task-templates.dto'
import type {
  CreateTestReportItemBodyMainDto,
  CreateTestReportItemSuccessResultDto,
  CreateTestReportItemsBodyMainDto,
  CreateTestReportItemsSuccessResultDto,
  CreateTestReportMessageBodyDto,
  CreateTestReportMessageSuccessResultDto,
  CreateTestReportMessagesBodyDto,
  CreateTestReportMessagesSuccessResultDto,
  DeleteTestReportItemUnsafeBodyDto,
  DeleteTestReportItemUnsafeSuccessResultDto,
  DeleteTestReportItemsUnsafeBodyDto,
  DeleteTestReportItemsUnsafeSuccessResultDto,
  FinishTestAsErrorBodyDto,
  FinishTestAsErrorSuccessResultDto,
  FinishTestAsFailedBodyDto,
  FinishTestAsFailedSuccessResultDto,
  FinishTestAsPassedBodyDto,
  FinishTestAsPassedSuccessResultDto,
  LaunchTestBodyDto,
  LaunchTestSuccessResultDto,
  ReadTestReportExtraParamsDto,
  ReadTestReportItemDataExtraParamsDto,
  ReadTestReportItemDataParamsDto,
  ReadTestReportParamsDto,
  ReadTestReportQueryDto,
  ReadTestReportWithAllPropsSuccessResultDto,
  ReadTestReportWithPrimaryPropsSuccessResultDto,
  ReadTestReportWithUpToSecondaryPropsSuccessResultDto,
  ReadTestReportWithUpToTertiaryPropsSuccessResultDto,
  ReadTestReportsCountQueryDto,
  ReadTestReportsCountSuccessResultDto,
  ReadTestReportsQueryDto,
  ReadTestReportsWithPrimaryPropsSuccessResultItemDto,
  ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/test-reports.dto'
import type {
  ReadSubgroupReportExtraParamsDto,
  ReadSubgroupReportParamsDto,
  ReadSubgroupReportQueryDto,
  ReadSubgroupReportWithAllPropsSuccessResultDto,
  ReadSubgroupReportWithPrimaryPropsSuccessResultDto,
  ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto,
  ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto,
  ReadSubgroupReportsCountQueryDto,
  ReadSubgroupReportsCountSuccessResultDto,
  ReadSubgroupReportsQueryDto,
  ReadSubgroupReportsWithPrimaryPropsSuccessResultItemDto,
  ReadSubgroupReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/subgroup-reports.dto'
import type {
  ReadGroupReportExtraParamsDto,
  ReadGroupReportParamsDto,
  ReadGroupReportQueryDto,
  ReadGroupReportWithAllPropsSuccessResultDto,
  ReadGroupReportWithPrimaryPropsSuccessResultDto,
  ReadGroupReportWithUpToSecondaryPropsSuccessResultDto,
  ReadGroupReportWithUpToTertiaryPropsSuccessResultDto,
  ReadGroupReportsCountQueryDto,
  ReadGroupReportsCountSuccessResultDto,
  ReadGroupReportsQueryDto,
  ReadGroupReportsWithPrimaryPropsSuccessResultItemDto,
  ReadGroupReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/group-reports.dto'
import type {
  ReadTaskReportParamsDto,
  ReadTaskReportQueryDto,
  ReadTaskReportWithAllPropsSuccessResultDto,
  ReadTaskReportWithPrimaryPropsSuccessResultDto,
  ReadTaskReportWithUpToSecondaryPropsSuccessResultDto,
  ReadTaskReportWithUpToTertiaryPropsSuccessResultDto,
  ReadTaskReportsCountQueryDto,
  ReadTaskReportsCountSuccessResultDto,
  ReadTaskReportsQueryDto,
  ReadTaskReportsWithPrimaryPropsSuccessResultItemDto,
  ReadTaskReportsWithUpToSecondaryPropsSuccessResultItemDto
} from '@common/dtos/server-api/task-reports.dto'
import type {
  CreateSliceBodyDto,
  CreateSliceSuccessResultDto,
  DeleteSliceBodyDto,
  DeleteSliceSuccessResultDto,
  DeleteSlicesBodyDto,
  DeleteSlicesSuccessResultDto,
  ReadSliceExistsFlagQueryDto,
  ReadSliceExistsFlagSuccessResultDto,
  ReadSliceParamsDto,
  ReadSliceQueryDto,
  ReadSliceTransitionsCountParamsDto,
  ReadSliceTransitionsCountQueryDto,
  ReadSliceTransitionsCountSuccessResultDto,
  ReadSliceTransitionsParamsDto,
  ReadSliceTransitionsQueryDto,
  ReadSliceTransitionsSuccessResultItemDto,
  ReadSliceVersionParamsDto,
  ReadSliceVersionSuccessResultDto,
  ReadSliceWithAllPropsSuccessResultDto,
  ReadSliceWithPrimaryPropsSuccessResultDto,
  ReadSliceWithUpToSecondaryPropsSuccessResultDto,
  ReadSliceWithUpToTertiaryPropsSuccessResultDto,
  ReadSlicesCountQueryDto,
  ReadSlicesCountSuccessResultDto,
  ReadSlicesQueryDto,
  ReadSlicesWithPrimaryPropsSuccessResultItemDto,
  ReadSlicesWithUpToSecondaryPropsSuccessResultItemDto,
  UpdateSliceBodyDto,
  UpdateSliceSuccessResultDto
} from '@common/dtos/server-api/slices.dto'
import type {
  SubscribeToActionInfosDataItemDto,
  SubscribeToActionInfosNotificationDto,
  SubscribeToActionInfosParamsDto,
  SubscribeToEventsDataItemDto,
  SubscribeToEventsNotificationDto,
  SubscribeToEventsParamsDto,
  SubscribeToResourceDataDto,
  SubscribeToResourceNotificationDto,
  SubscribeToResourceParamsDto,
  SubscribeToResourcesDataDto,
  SubscribeToResourcesNotificationDto,
  SubscribeToResourcesParamsDto,
  UnsubscribeManyParamsDto,
  UnsubscribeOneParamsDto
} from '@common/dtos/server-api/subscriptions.dto'
import type { DtoWithoutEnums } from '@common/dto-without-enums'
import { WEB_SOCKET_CONFIG } from '@common/web-socket-config'
import { generateRandomInt } from '@common/utilities'
import { log, logWithoutTime } from '../utilities'
import type {
  ServerConnectorCredentials,
  ServerConnectorDelegate
} from './delegate'
import {
  SERVER_CONNECTOR_ERROR_STATUS,
  ServerConnectorError,
  ServerConnectorBadRequestError,
  ServerConnectorConflictError,
  ServerConnectorForbiddenError,
  ServerConnectorIseError,
  ServerConnectorNotFoundError,
  ServerConnectorUnauthorizedError
} from './error'
// Other
import type { AxiosResponse } from 'axios'
import axios from 'axios'
// import type { ClassConstructor } from 'class-transformer'
// import { plainToClass } from 'class-transformer'
// import { validateOrReject } from 'class-validator'
import { isEqual } from 'lodash'
import type { Socket } from 'socket.io-client'
import { io } from 'socket.io-client'
import Queue from 'yocto-queue'

const HOST = 'http://localhost:3000'
const PATH_PREFIX = '/api'
const SECS = 1000
const MINS = 60 * SECS
const MIN_DURATION_TO_TOKEN_EXPIRATION_TO_PLAN_REFRESH = 1 * MINS
const MAX_DURATION_TO_TOKEN_EXPIRATION_TO_PLAN_REFRESH = 2 * MINS
const MIN_DURATION_FROM_NOW_TO_PLAN_TOKEN_REFRESH = 1 * SECS
const MAX_DURATION_FROM_NOW_TO_PLAN_TOKEN_REFRESH = 5 * SECS
const WEB_SOCKET_RECONNECTION_DELAY = 2000
const WEB_SOCKET_RESUBSCRIBE_DELAY = 1000
const NOTIFICATIONS_BUFFER_PROCESS_INTERVAL = 200

export interface PrimaryPropsScopeWrap {
  scope: 'PRIMARY_PROPS'
}

export interface UpToSecondaryPropsScopeWrap {
  scope: 'UP_TO_SECONDARY_PROPS'
}

export interface UpToTertiaryPropsScopeWrap {
  scope: 'UP_TO_TERTIARY_PROPS'
}

export interface AllPropsScopeWrap {
  scope: 'ALL_PROPS'
}

export interface ChangeablePrimaryPropsScopeWrap {
  scope: 'CHANGEABLE_PRIMARY_PROPS'
}

export interface ChangeableUpToSecondaryPropsScopeWrap {
  scope: 'CHANGEABLE_UP_TO_SECONDARY_PROPS'
}

export interface ChangeableUpToTertiaryPropsScopeWrap {
  scope: 'CHANGEABLE_UP_TO_TERTIARY_PROPS'
}

export interface ChangeableAllPropsScopeWrap {
  scope: 'CHANGEABLE_ALL_PROPS'
}

export type ReadOneScopeWrap =
  | PrimaryPropsScopeWrap
  | UpToSecondaryPropsScopeWrap
  | UpToTertiaryPropsScopeWrap
  | AllPropsScopeWrap

export type ReadOneChangeableScopeWrap =
  | PrimaryPropsScopeWrap
  | UpToSecondaryPropsScopeWrap
  | UpToTertiaryPropsScopeWrap
  | AllPropsScopeWrap
  | ChangeablePrimaryPropsScopeWrap
  | ChangeableUpToSecondaryPropsScopeWrap
  | ChangeableUpToTertiaryPropsScopeWrap
  | ChangeableAllPropsScopeWrap

export type ReadManyScopeWrap =
  | PrimaryPropsScopeWrap
  | UpToSecondaryPropsScopeWrap

type ReadOneExtra<
  ScopeWrap extends ReadOneScopeWrap,
  ReadExtraDto
> = DtoWithoutEnums<Omit<ReadExtraDto, 'scope'> & ScopeWrap>

type ReadOneChangeableExtra<
  ScopeWrap extends ReadOneChangeableScopeWrap,
  ReadExtraDto
> = DtoWithoutEnums<Omit<ReadExtraDto, 'scope'> & ScopeWrap>

type ReadManyParams<
  ScopeWrap extends ReadManyScopeWrap,
  ReadParamsDto
> = DtoWithoutEnums<Omit<ReadParamsDto, 'scope'> & ScopeWrap>

type Params<ParamsDto> = DtoWithoutEnums<ParamsDto>

type Extra<ExtraDto> = DtoWithoutEnums<ExtraDto>

type ReadOneResult<
  ScopeWrap,
  ReadWithPrimaryPropsSuccessResultDto,
  ReadWithUpToSecondaryPropsSuccessResultDto,
  ReadWithUpToTertiaryPropsSuccessResultDto,
  ReadWithAllPropsSuccessResultDto
> = Promise<
  DtoWithoutEnums<
    ScopeWrap extends PrimaryPropsScopeWrap
      ? ReadWithPrimaryPropsSuccessResultDto
      : ScopeWrap extends UpToSecondaryPropsScopeWrap
        ? ReadWithUpToSecondaryPropsSuccessResultDto
        : ScopeWrap extends UpToTertiaryPropsScopeWrap
          ? ReadWithUpToTertiaryPropsSuccessResultDto
          : ReadWithAllPropsSuccessResultDto
  >
>

type ReadOneChangeableResult<
  ScopeWrap,
  ReadWithPrimaryPropsSuccessResultDto,
  ReadWithUpToSecondaryPropsSuccessResultDto,
  ReadWithUpToTertiaryPropsSuccessResultDto,
  ReadWithAllPropsSuccessResultDto,
  ReadWithChangeablePrimaryPropsSuccessResultDto,
  ReadWithChangeableUpToSecondaryPropsSuccessResultDto,
  ReadWithChangeableUpToTertiaryPropsSuccessResultDto,
  ReadWithChangeableAllPropsSuccessResultDto
> = Promise<
  DtoWithoutEnums<
    ScopeWrap extends PrimaryPropsScopeWrap
      ? ReadWithPrimaryPropsSuccessResultDto
      : ScopeWrap extends UpToSecondaryPropsScopeWrap
        ? ReadWithUpToSecondaryPropsSuccessResultDto
        : ScopeWrap extends UpToTertiaryPropsScopeWrap
          ? ReadWithUpToTertiaryPropsSuccessResultDto
          : ScopeWrap extends AllPropsScopeWrap
            ? ReadWithAllPropsSuccessResultDto
            : ScopeWrap extends ChangeablePrimaryPropsScopeWrap
              ? ReadWithChangeablePrimaryPropsSuccessResultDto
              : ScopeWrap extends ChangeableUpToSecondaryPropsScopeWrap
                ? ReadWithChangeableUpToSecondaryPropsSuccessResultDto
                : ScopeWrap extends ChangeableUpToTertiaryPropsScopeWrap
                  ? ReadWithChangeableUpToTertiaryPropsSuccessResultDto
                  : ReadWithChangeableAllPropsSuccessResultDto
  >
>

type ReadManyResult<
  ScopeWrap,
  ReadWithPrimaryPropsSuccessResultItemDto,
  ReadWithUpToSecondaryPropsSuccessResultItemDto
> = Promise<
  DtoWithoutEnums<
    ScopeWrap extends PrimaryPropsScopeWrap
      ? ReadWithPrimaryPropsSuccessResultItemDto
      : ReadWithUpToSecondaryPropsSuccessResultItemDto
  >[]
>

type Result<SuccessResultDto> = Promise<DtoWithoutEnums<SuccessResultDto>>

type MultipartFormVal = SimpleObject | File | File[]

interface SubscriptionBlock {
  subscriptionId: number
  type: 'SELF_META' | 'RESOURCE' | 'RESOURCES' | 'ACTION_INFOS' | 'EVENTS'
  params?: any
  handler?: (data: any) => void
}

interface SelfMeta {
  id: number
  login: string
  rights: Right[]
}

export type ServerConnectorMeta =
  | {
      status: 'NOT_CONNECTED' | 'NOT_SETUP' | 'NOT_AUTHENTICATED'
    }
  | {
      status: 'AUTHENTICATED'
      selfMeta: SelfMeta
    }

export class ServerConnector {
  private connectPr: Promise<void> | null = null
  private credentials: ServerConnectorCredentials | null = null
  // private accessToken: string | null = null
  private refreshTokensPlanId: NodeJS.Timeout | null = null
  private socket: Socket | null = null
  private lastUsedSubscriptionId = -1
  private subscriptionBlockForSubscriptionId = new Map<
    number,
    SubscriptionBlock
  >()
  private serverSubscriptionIdForSubscriptionId = new Map<number, number>()
  private subscriptionIdForServerSubscriptionId = new Map<number, number>()
  private inactiveSubscriptionIds = new Queue<number>()
  private activateSubscriptionsPlanId: NodeJS.Timeout | null = null
  private notificationDatasForSubscriptionId = new Map<number, any[]>()
  meta: ServerConnectorMeta = {
    status: 'NOT_CONNECTED'
  }
  constructor(
    private delegate: ServerConnectorDelegate,
    private host: string = ''
  ) {
    this.credentials = delegate.getCredentials()
    this.launchNotificationsBufferProcess()
  }
  // Authenticate
  async connect() {
    if (this.connectPr !== null) {
      return Promise.allSettled([this.connectPr])
    } else {
      this.connectPr = (async () => {
        try {
          await this.readMeta()
          await this.authenticate()
          const accessTokenExpirationTime =
            this.credentials?.accessTokenExpirationTime
          if (accessTokenExpirationTime !== undefined) {
            this.planToRefreshTokens(accessTokenExpirationTime)
          }
        } catch (error) {
          if (error instanceof ServerConnectorUnauthorizedError === false) {
            this.connectPr = null
            throw error
          }
        }
      })()
      await this.connectPr
    }
  }
  // Auth
  async login(params: Params<LoginBodyDto>) {
    const result = await this.postForObject<
      DtoWithoutEnums<LoginSuccessResultDto>
    >('/auth/login', params, false, false)
    this.meta = {
      status: 'AUTHENTICATED',
      selfMeta: {
        id: result.userId,
        login: params.login,
        rights: result.rights
      }
    }
    this.credentials = result
    this.delegate.setCredentials(result)
    this.planToRefreshTokens(result.accessTokenExpirationTime)
    this.initWebSocket()
    return {
      userId: result.userId,
      rights: result.rights
    }
  }
  async logout(params: { deactivateAllTokens: boolean }): Promise<void> {
    this.credentials = this.delegate.getCredentials()
    if (this.credentials !== null) {
      await this.postForObject<object>(
        '/auth/logout',
        {
          refreshToken: this.credentials.refreshToken,
          accessToken: this.credentials.accessToken,
          deactivateAllTokens: params.deactivateAllTokens
        } as LogoutBodyDto,
        false,
        false
      )
      this.meta = {
        status: 'NOT_AUTHENTICATED'
      }
      this.credentials = null
      this.delegate.deleteCredentials()
      this.destroyWebSocket()
    }
  }
  // Auth private
  private async authenticate(): Promise<void> {
    this.credentials = this.delegate.getCredentials()
    // Try to use access token
    if (
      this.credentials !== null &&
      this.credentials.accessTokenExpirationTime.getTime() >
        new Date().getTime()
    ) {
      try {
        await this.check()
        this.initWebSocket()
        return
      } catch (error) {
        if (
          error instanceof ServerConnectorError &&
          error.status === SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED
        ) {
          //
        } else {
          throw error
        }
      }
    }
    // Try to use refresh token
    if (
      this.credentials !== null &&
      this.credentials.refreshTokenExpirationTime.getTime() >
        new Date().getTime()
    ) {
      try {
        await this.refreshTokens(this.credentials.refreshToken)
        this.initWebSocket()
        return
      } catch (error) {
        if (
          error instanceof ServerConnectorError &&
          error.status === SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED
        ) {
          this.credentials = null
          this.delegate.deleteCredentials()
        }
        throw error
      }
    }
    if (this.meta.status === 'AUTHENTICATED') {
      this.meta = {
        status: 'NOT_AUTHENTICATED'
      }
    }
    this.credentials = null
    this.delegate.deleteCredentials()
    throw new ServerConnectorUnauthorizedError()
  }
  private async check(): Promise<object> {
    return await this.getObject<object>('/auth/check', undefined, true, false)
  }
  private planToRefreshTokens(accessTokenExpirationTime: Date) {
    if (this.refreshTokensPlanId !== null) {
      clearTimeout(this.refreshTokensPlanId)
    }
    const currentTime = new Date()
    const currentTimeMs = currentTime.getTime()
    const accessTokenExpirationTimeMs = accessTokenExpirationTime.getTime()
    const minRefreshTimeMs = Math.max(
      currentTimeMs + MIN_DURATION_FROM_NOW_TO_PLAN_TOKEN_REFRESH,
      accessTokenExpirationTimeMs -
        MAX_DURATION_TO_TOKEN_EXPIRATION_TO_PLAN_REFRESH
    )
    const maxRefreshTimeMs = Math.max(
      currentTimeMs + MAX_DURATION_FROM_NOW_TO_PLAN_TOKEN_REFRESH,
      accessTokenExpirationTimeMs -
        MIN_DURATION_TO_TOKEN_EXPIRATION_TO_PLAN_REFRESH
    )
    const refreshTimeMs = generateRandomInt(minRefreshTimeMs, maxRefreshTimeMs)
    this.refreshTokensPlanId = setTimeout(() => {
      void (async () => {
        this.credentials = this.delegate.getCredentials()
        if (this.credentials === null) {
          return
        }
        if (
          this.credentials.accessTokenExpirationTime.getTime() -
            new Date().getTime() >
          MAX_DURATION_TO_TOKEN_EXPIRATION_TO_PLAN_REFRESH
        ) {
          this.planToRefreshTokens(this.credentials.accessTokenExpirationTime)
        } else {
          await this.refreshTokens(this.credentials.refreshToken)
        }
      })()
    }, refreshTimeMs - currentTimeMs)
  }
  private async refreshTokens(refreshToken: string): Promise<void> {
    const result = await this.postForObject<RefreshTokensSuccessResultDto>(
      '/auth/refresh-tokens',
      { refreshToken: refreshToken } as RefreshTokensBodyDto,
      false,
      false
    )
    if (this.credentials !== null) {
      this.meta = {
        status: 'AUTHENTICATED',
        selfMeta: {
          id: this.credentials.userId,
          login: this.credentials.login,
          rights: this.credentials.rights
        }
      }
      this.credentials = {
        ...this.credentials,
        ...result
      }
      this.delegate.setCredentials(this.credentials)
    }
    log(['Tokens refreshed'], 'default')
    this.planToRefreshTokens(result.accessTokenExpirationTime)
  }
  private initWebSocket() {
    if (
      (this.socket === null || this.socket.connected === false) &&
      this.credentials !== null
    ) {
      try {
        this.socket = io(HOST, {
          extraHeaders: {
            Authorization: `Bearer ${this.credentials.accessToken}`
          },
          reconnection: false
        })
      } catch {
        setTimeout(() => {
          this.initWebSocket()
        }, WEB_SOCKET_RECONNECTION_DELAY)
      }
      const socket = this.socket!
      socket.on('connect', () => {
        // console.log('WS: CONNECTED')
        void this.activateSubscriptions()
      })
      const emit = (notification: { subscriptionId: number; data: any }) => {
        // console.log(`WS: NOTIFICATION`, notification)
        const subscriptionId = this.subscriptionIdForServerSubscriptionId.get(
          notification.subscriptionId
        )
        if (subscriptionId !== undefined) {
          this.addNotificationToBuffer(subscriptionId, notification.data)
          // this.subscriptionBlockForSubscriptionId
          //   .get(subscriptionId)
          //   ?.handler?.(notification.data)
        }
      }
      socket.on(
        WEB_SOCKET_CONFIG.MESSAGE_TYPE.RESOURCE_NOTIFICATION,
        (notification: SubscribeToResourceNotificationDto) => {
          emit(notification)
        }
      )
      socket.on(
        WEB_SOCKET_CONFIG.MESSAGE_TYPE.RESOURCES_NOTIFICATION,
        (notification: SubscribeToResourcesNotificationDto) => {
          emit(notification)
        }
      )
      socket.on(
        WEB_SOCKET_CONFIG.MESSAGE_TYPE.ACTION_INFOS_NOTIFICATION,
        (notification: SubscribeToActionInfosNotificationDto) => {
          emit(notification)
        }
      )
      socket.on(
        WEB_SOCKET_CONFIG.MESSAGE_TYPE.EVENTS_NOTIFICATION,
        (notification: SubscribeToEventsNotificationDto) => {
          emit(notification)
        }
      )
      socket.on('disconnect', () => {
        this.socket = null
        this.serverSubscriptionIdForSubscriptionId.clear()
        this.subscriptionIdForServerSubscriptionId.clear()
        this.inactiveSubscriptionIds.clear()
        for (const subscriptionId of this.subscriptionBlockForSubscriptionId.keys()) {
          this.inactiveSubscriptionIds.enqueue(subscriptionId)
        }
        setTimeout(() => {
          this.initWebSocket()
        }, WEB_SOCKET_RECONNECTION_DELAY)
        // console.log('WS: DISCONNECTED')
      })
    }
  }
  private destroyWebSocket() {
    if (this.socket !== null && this.socket.connected) {
      this.socket.disconnect()
    }
    this.socket = null
  }
  private addNotificationToBuffer(subscriptionId: number, data: any) {
    if (this.notificationDatasForSubscriptionId.has(subscriptionId) === false) {
      this.notificationDatasForSubscriptionId.set(subscriptionId, [])
    }
    const bufferDatas =
      this.notificationDatasForSubscriptionId.get(subscriptionId)!
    if (
      bufferDatas.every((bufferData) => isEqual(data, bufferData) === false)
    ) {
      bufferDatas.push(data)
    }
  }
  private launchNotificationsBufferProcess() {
    setInterval(() => {
      const buffer = this.notificationDatasForSubscriptionId
      this.notificationDatasForSubscriptionId = new Map<number, any[]>()
      for (const [subscriptionId, datas] of buffer) {
        for (const data of datas) {
          this.subscriptionBlockForSubscriptionId
            .get(subscriptionId)
            ?.handler?.(data)
        }
      }
    }, NOTIFICATIONS_BUFFER_PROCESS_INTERVAL)
  }
  // Common
  async readMeta(): Result<ReadMetaSuccessResultDto> {
    const result = await (this.getObject(
      `/common/meta`,
      undefined,
      false,
      false
    ) as Result<ReadMetaSuccessResultDto>)

    if (result.setup === false) {
      this.meta = {
        status: 'NOT_SETUP'
      }
    } else if (
      this.meta.status === 'NOT_CONNECTED' ||
      this.meta.status === 'NOT_SETUP'
    ) {
      this.meta = {
        status: 'NOT_AUTHENTICATED'
      }
    }
    return result
  }
  setup(params: Params<SetupBodyDto>): Result<SetupSuccessResultDto> {
    const result: Result<SetupSuccessResultDto> = this.postForObject(
      '/common/setup',
      params,
      false,
      false
    )
    this.meta = {
      status: 'NOT_AUTHENTICATED'
    }
    return result
  }
  async clearAll(): Promise<void> {
    await this.postForObject<object>('/common/setup')
    this.meta = {
      status: 'NOT_SETUP'
    }
    this.credentials = null
    this.delegate.deleteCredentials()
  }
  // Logs
  readStorageErrorsLogs(): Promise<Blob> {
    return this.getBlob('/logs/storage-errors')
  }
  readStorageIseErrorsLogs(): Promise<Blob> {
    return this.getBlob('/logs/storage-ise-errors')
  }
  readIseErrorRequestsLogs(): Promise<Blob> {
    return this.getBlob('/logs/ise-error-requests')
  }
  readErrorRequestsLogs(): Promise<Blob> {
    return this.getBlob('/logs/error-requests')
  }
  readRequestsLogs(): Promise<Blob> {
    return this.getBlob('/logs/requests')
  }
  // Actions
  readActionInfosCount(
    params: Params<ReadActionInfosCountQueryDto>
  ): Result<ReadActionInfosCountSuccessResultDto> {
    return this.getObject('/actions/count', params)
  }
  readActionInfo(
    params: Params<ReadActionInfoParamsDto>
  ): Result<ReadActionInfoSuccessResultDto> {
    return this.getObject(`/actions/${params.id}/info`)
  }
  readAction(
    params: Params<ReadActionParamsDto>
  ): Result<ReadActionSuccessResultDto> {
    return this.getObject(`/actions/${params.id}`)
  }
  readActionInfos(
    params: Params<ReadActionInfosQueryDto>
  ): Result<ReadActionInfosSuccessResultItemDto> {
    return this.getObject(`/actions`, params)
  }
  // Events
  readEventsCount(
    params: Params<ReadEventsCountQueryDto>
  ): Result<ReadEventsCountSuccessResultDto> {
    return this.getObject('/events/count', params)
  }
  readEvents(
    params: Params<ReadEventsQueryDto>
  ): Result<ReadEventsSuccessResultItemDto> {
    return this.getObject(`/events`, params)
  }
  // Roles
  async readRoleExistsFlag(
    params: ReadRoleExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadRoleExistsFlagSuccessResultDto>(
        '/roles/exists',
        params
      )
    ).exists
  }
  readRolesCount(
    params: Params<ReadRolesCountQueryDto>
  ): Result<ReadRolesCountSuccessResultDto> {
    return this.getObject('/roles/count', params)
  }
  readRoleVersion(
    params: Params<ReadRoleVersionParamsDto>
  ): Result<ReadRoleVersionSuccessResultDto> {
    return this.getObject(
      `/roles/${params.id}/versions/${params.transitionNum}`
    )
  }
  readRoleTransitionsCount(
    params: Params<ReadRoleTransitionsCountParamsDto>,
    extra: Extra<ReadRoleTransitionsCountQueryDto>
  ): Result<ReadRoleTransitionsCountSuccessResultDto> {
    return this.getObject(`/roles/${params.id}/transitions/count`, extra)
  }
  readRoleTransitions(
    params: Params<ReadRoleTransitionsParamsDto>,
    extra: Extra<ReadRoleTransitionsQueryDto>
  ): Result<ReadRoleTransitionsSuccessResultItemDto> {
    return this.getObject(`/roles/${params.id}/transitions`, extra)
  }
  readRole<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadRoleParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadRoleQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadRoleWithPrimaryPropsSuccessResultDto,
    ReadRoleWithUpToSecondaryPropsSuccessResultDto,
    ReadRoleWithUpToTertiaryPropsSuccessResultDto,
    ReadRoleWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/roles/${params.id}`, extra)
  }
  readRoles<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadRolesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadRolesWithPrimaryPropsSuccessResultItemDto,
    ReadRolesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/roles', params)
  }
  createRole(
    params: Params<CreateRoleBodyDto>
  ): Result<CreateRoleSuccessResultDto> {
    return this.postForObject('/roles/actions/create', params)
  }
  updateRole(
    params: Params<UpdateRoleBodyDto>
  ): Result<UpdateRoleSuccessResultDto> {
    return this.postForObject('/roles/actions/update', params)
  }
  deleteRoleUnsafe(
    params: Params<DeleteRoleUnsafeBodyDto>
  ): Result<DeleteRoleUnsafeSuccessResultDto> {
    return this.postForObject('/roles/actions/delete-unsafe', params)
  }
  deleteRole(
    params: Params<DeleteRoleBodyDto>
  ): Result<DeleteRoleSuccessResultDto> {
    return this.postForObject('/roles/actions/delete', params)
  }
  deleteRolesUnsafe(
    params: Params<DeleteRolesUnsafeBodyDto>
  ): Result<DeleteRolesUnsafeSuccessResultDto> {
    return this.postForObject('/roles/actions/delete-many-unsafe', params)
  }
  deleteRoles(
    params: Params<DeleteRolesBodyDto>
  ): Result<DeleteRolesSuccessResultDto> {
    return this.postForObject('/roles/actions/delete-many', params)
  }
  // Users
  async readSelfMeta(): Result<ReadSelfMetaSuccessResultDto> {
    const selfMeta: DtoWithoutEnums<ReadSelfMetaSuccessResultDto> =
      await this.getObject('/users/self-meta')
    this.meta = {
      status: 'AUTHENTICATED',
      selfMeta: selfMeta
    }
    if (this.credentials !== null) {
      this.credentials.userId = selfMeta.id
      this.credentials.login = selfMeta.login
      this.credentials.rights = selfMeta.rights
      this.delegate.setCredentials(this.credentials)
    }
    return selfMeta
  }
  async readUserExistsFlag(
    params: ReadUserExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadUserExistsFlagSuccessResultDto>(
        '/users/exists',
        params
      )
    ).exists
  }
  readUsersCount(
    params: Params<ReadUsersCountQueryDto>
  ): Result<ReadUsersCountSuccessResultDto> {
    return this.getObject('/users/count', params)
  }
  readUserVersion(
    params: Params<ReadUserVersionParamsDto>
  ): Result<ReadUserVersionSuccessResultDto> {
    return this.getObject(
      `/users/${params.id}/versions/${params.transitionNum}`
    )
  }
  readUserTransitionsCount(
    params: Params<ReadUserTransitionsCountParamsDto>,
    extra: Extra<ReadUserTransitionsCountQueryDto>
  ): Result<ReadUserTransitionsCountSuccessResultDto> {
    return this.getObject(`/users/${params.id}/transitions/count`, extra)
  }
  readUserTransitions(
    params: Params<ReadUserTransitionsParamsDto>,
    extra: Extra<ReadUserTransitionsQueryDto>
  ): Result<ReadUserTransitionsSuccessResultItemDto> {
    return this.getObject(`/users/${params.id}/transitions`, extra)
  }
  readUser<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadUserParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadUserQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadUserWithPrimaryPropsSuccessResultDto,
    ReadUserWithUpToSecondaryPropsSuccessResultDto,
    ReadUserWithUpToTertiaryPropsSuccessResultDto,
    ReadUserWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/users/${params.id}`, extra)
  }
  readUsers<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadUsersQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadUsersWithPrimaryPropsSuccessResultItemDto,
    ReadUsersWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/users', params)
  }
  createUser(
    params: Params<CreateUserBodyDto>
  ): Result<CreateUserSuccessResultDto> {
    return this.postForObject('/users/actions/create', params)
  }
  updateUser(
    params: Params<UpdateUserBodyDto>
  ): Result<UpdateUserSuccessResultDto> {
    return this.postForObject('/users/actions/update', params)
  }
  updateUserPass(
    params: Params<UpdateUserPassBodyDto>
  ): Result<UpdateUserPassSuccessResultDto> {
    return this.postForObject('/users/actions/update-pass', params)
  }
  deleteUser(
    params: Params<DeleteUserBodyDto>
  ): Result<DeleteUserSuccessResultDto> {
    return this.postForObject('/users/actions/delete', params)
  }
  deleteUsers(
    params: Params<DeleteUsersBodyDto>
  ): Result<DeleteUsersSuccessResultDto> {
    return this.postForObject('/users/actions/delete-many', params)
  }
  // Tags
  async readTagExistsFlag(params: ReadTagExistsFlagQueryDto): Promise<boolean> {
    return (
      await this.getObject<ReadTagExistsFlagSuccessResultDto>(
        '/tags/exists',
        params
      )
    ).exists
  }
  readTagsCount(
    params: Params<ReadTagsCountQueryDto>
  ): Result<ReadTagsCountSuccessResultDto> {
    return this.getObject('/tags/count', params)
  }
  readTagVersion(
    params: Params<ReadTagVersionParamsDto>
  ): Result<ReadTagVersionSuccessResultDto> {
    return this.getObject(`/tags/${params.id}/versions/${params.transitionNum}`)
  }
  readTagTransitionsCount(
    params: Params<ReadTagTransitionsCountParamsDto>,
    extra: Extra<ReadTagTransitionsCountQueryDto>
  ): Result<ReadTagTransitionsCountSuccessResultDto> {
    return this.getObject(`/tags/${params.id}/transitions/count`, extra)
  }
  readTagTransitions(
    params: Params<ReadTagTransitionsParamsDto>,
    extra: Extra<ReadTagTransitionsQueryDto>
  ): Result<ReadTagTransitionsSuccessResultItemDto> {
    return this.getObject(`/tags/${params.id}/transitions`, extra)
  }
  readTag<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTagParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTagQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTagWithPrimaryPropsSuccessResultDto,
    ReadTagWithUpToSecondaryPropsSuccessResultDto,
    ReadTagWithUpToTertiaryPropsSuccessResultDto,
    ReadTagWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/tags/${params.id}`, extra)
  }
  readTags<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTagsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTagsWithPrimaryPropsSuccessResultItemDto,
    ReadTagsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/tags', params)
  }
  createTag(
    params: Params<CreateTagBodyDto>
  ): Result<CreateTagSuccessResultDto> {
    return this.postForObject('/tags/actions/create', params)
  }
  updateTag(
    params: Params<UpdateTagBodyDto>
  ): Result<UpdateTagSuccessResultDto> {
    return this.postForObject('/tags/actions/update', params)
  }
  deleteTag(
    params: Params<DeleteTagBodyDto>
  ): Result<DeleteTagSuccessResultDto> {
    return this.postForObject('/tags/actions/delete', params)
  }
  deleteTags(
    params: Params<DeleteTagsBodyDto>
  ): Result<DeleteTagsSuccessResultDto> {
    return this.postForObject('/tags/actions/delete-many', params)
  }
  // Documents
  async readDocumentExistsFlag(
    params: ReadDocumentExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadDocumentExistsFlagSuccessResultDto>(
        '/documents/exists',
        params
      )
    ).exists
  }
  readDocumentsCount(
    params: Params<ReadDocumentsCountQueryDto>
  ): Result<ReadDocumentsCountSuccessResultDto> {
    return this.getObject('/documents/count', params)
  }
  readDocumentVersionConfig(
    params: Params<ReadDocumentVersionConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/documents/${params.id}/versions/${params.transitionNum}/config`
    )
  }
  readDocumentVersion(
    params: Params<ReadDocumentVersionParamsDto>
  ): Result<ReadDocumentVersionSuccessResultDto> {
    return this.getObject(
      `/documents/${params.id}/versions/${params.transitionNum}`
    )
  }
  readDocumentTransitionsCount(
    params: Params<ReadDocumentTransitionsCountParamsDto>,
    extra: Extra<ReadDocumentTransitionsCountQueryDto>
  ): Result<ReadDocumentTransitionsCountSuccessResultDto> {
    return this.getObject(`/documents/${params.id}/transitions/count`, extra)
  }
  readDocumentTransitions(
    params: Params<ReadDocumentTransitionsParamsDto>,
    extra: Extra<ReadDocumentTransitionsQueryDto>
  ): Result<ReadDocumentTransitionsSuccessResultItemDto> {
    return this.getObject(`/documents/${params.id}/transitions`, extra)
  }
  readDocumentConfig(
    params: Params<ReadDocumentConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/documents/${params.id}/config`)
  }
  readDocument<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadDocumentParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadDocumentQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadDocumentWithPrimaryPropsSuccessResultDto,
    ReadDocumentWithUpToSecondaryPropsSuccessResultDto,
    ReadDocumentWithUpToTertiaryPropsSuccessResultDto,
    ReadDocumentWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/documents/${params.id}`, extra)
  }
  readDocuments<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadDocumentsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadDocumentsWithPrimaryPropsSuccessResultItemDto,
    ReadDocumentsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/documents', params)
  }
  createDocument(
    main: Params<CreateDocumentBodyMainDto>,
    config: File
  ): Result<CreateDocumentSuccessResultDto> {
    return this.postMultipartFormForObject(
      '/documents/actions/create',
      new Map<string, MultipartFormVal>([
        ['main', main],
        ['config', config]
      ])
    )
  }
  updateDocument(
    params: Params<UpdateDocumentBodyDto>
  ): Result<UpdateDocumentSuccessResultDto> {
    return this.postForObject('/documents/actions/update', params)
  }
  deleteDocumentUnsafe(
    params: Params<DeleteDocumentUnsafeBodyDto>
  ): Result<DeleteDocumentUnsafeSuccessResultDto> {
    return this.postForObject('/documents/actions/delete-unsafe', params)
  }
  deleteDocument(
    params: Params<DeleteDocumentBodyDto>
  ): Result<DeleteDocumentSuccessResultDto> {
    return this.postForObject('/documents/actions/delete', params)
  }
  deleteDocumentsUnsafe(
    params: Params<DeleteDocumentsUnsafeBodyDto>
  ): Result<DeleteDocumentsUnsafeSuccessResultDto> {
    return this.postForObject('/documents/actions/delete-many-unsafe', params)
  }
  deleteDocuments(
    params: Params<DeleteDocumentsBodyDto>
  ): Result<DeleteDocumentsSuccessResultDto> {
    return this.postForObject('/documents/actions/delete-many', params)
  }
  // Fragments
  async readFragmentExistsFlag(
    params: ReadFragmentExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadFragmentExistsFlagSuccessResultDto>(
        '/fragments/exists',
        params
      )
    ).exists
  }
  readFragmentsCount(
    params: Params<ReadFragmentsCountQueryDto>
  ): Result<ReadFragmentsCountSuccessResultDto> {
    return this.getObject('/fragments/count', params)
  }
  readFragmentVersionConfig(
    params: Params<ReadFragmentVersionConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/fragments/${params.id}/versions/${params.transitionNum}/config`
    )
  }
  readFragmentVersion(
    params: Params<ReadFragmentVersionParamsDto>
  ): Result<ReadFragmentVersionSuccessResultDto> {
    return this.getObject(
      `/fragments/${params.id}/versions/${params.transitionNum}`
    )
  }
  readFragmentTransitionsCount(
    params: Params<ReadFragmentTransitionsCountParamsDto>,
    extra: Extra<ReadFragmentTransitionsCountQueryDto>
  ): Result<ReadFragmentTransitionsCountSuccessResultDto> {
    return this.getObject(`/fragments/${params.id}/transitions/count`, extra)
  }
  readFragmentTransitions(
    params: Params<ReadFragmentTransitionsParamsDto>,
    extra: Extra<ReadFragmentTransitionsQueryDto>
  ): Result<ReadFragmentTransitionsSuccessResultItemDto> {
    return this.getObject(`/fragments/${params.id}/transitions`, extra)
  }
  readFragmentConfig(
    params: Params<ReadFragmentConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/fragments/${params.id}/config`)
  }
  readFragment<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadFragmentParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadFragmentQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadFragmentWithPrimaryPropsSuccessResultDto,
    ReadFragmentWithUpToSecondaryPropsSuccessResultDto,
    ReadFragmentWithUpToTertiaryPropsSuccessResultDto,
    ReadFragmentWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/fragments/${params.id}`, extra)
  }
  readFragments<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadFragmentsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadFragmentsWithPrimaryPropsSuccessResultItemDto,
    ReadFragmentsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/fragments', params)
  }
  createFragment(
    params: Params<CreateFragmentBodyDto>
  ): Result<CreateFragmentSuccessResultDto> {
    return this.postForObject('/fragments/actions/create', params)
  }
  updateFragment(
    params: Params<UpdateFragmentBodyDto>
  ): Result<UpdateFragmentSuccessResultDto> {
    return this.postForObject('/fragments/actions/update', params)
  }
  deleteFragment(
    params: Params<DeleteFragmentBodyDto>
  ): Result<DeleteFragmentSuccessResultDto> {
    return this.postForObject('/fragments/actions/delete', params)
  }
  deleteFragments(
    params: Params<DeleteFragmentsBodyDto>
  ): Result<DeleteFragmentsSuccessResultDto> {
    return this.postForObject('/fragments/actions/delete-many', params)
  }
  // Requirements
  async readRequirementExistsFlag(
    params: ReadRequirementExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadRequirementExistsFlagSuccessResultDto>(
        '/requirements/exists',
        params
      )
    ).exists
  }
  readRequirementsHierarchyVertex(
    params: Params<ReadRequirementsHierarchyVertexParamsDto>
  ): Result<ReadRequirementsHierarchyVertexSuccessResultDto> {
    return this.getObject(`/requirements/hierarchy/${params.id}`)
  }
  readRequirementsHierarchy(): Result<ReadRequirementsHierarchySuccessResultDto> {
    return this.getObject('/requirements/hierarchy')
  }
  readRequirementsCount(
    params: Params<ReadRequirementsCountQueryDto>
  ): Result<ReadRequirementsCountSuccessResultDto> {
    return this.getObject('/requirements/count', params)
  }
  readRequirementVersion(
    params: Params<ReadRequirementVersionParamsDto>
  ): Result<ReadRequirementVersionSuccessResultDto> {
    return this.getObject(
      `/requirements/${params.id}/versions/${params.transitionNum}`
    )
  }
  readRequirementTransitionsCount(
    params: Params<ReadRequirementTransitionsCountParamsDto>,
    extra: Extra<ReadRequirementTransitionsCountQueryDto>
  ): Result<ReadRequirementTransitionsCountSuccessResultDto> {
    return this.getObject(`/requirements/${params.id}/transitions/count`, extra)
  }
  readRequirementTransitions(
    params: Params<ReadRequirementTransitionsParamsDto>,
    extra: Extra<ReadRequirementTransitionsQueryDto>
  ): Result<ReadRequirementTransitionsSuccessResultItemDto> {
    return this.getObject(`/requirements/${params.id}/transitions`, extra)
  }
  readRequirement<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadRequirementParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadRequirementQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadRequirementWithPrimaryPropsSuccessResultDto,
    ReadRequirementWithUpToSecondaryPropsSuccessResultDto,
    ReadRequirementWithUpToTertiaryPropsSuccessResultDto,
    ReadRequirementWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/requirements/${params.id}`, extra)
  }
  readRequirements<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadRequirementsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadRequirementsWithPrimaryPropsSuccessResultItemDto,
    ReadRequirementsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/requirements', params)
  }
  createRequirement(
    params: Params<CreateRequirementBodyDto>
  ): Result<CreateRequirementSuccessResultDto> {
    return this.postForObject('/requirements/actions/create', params)
  }
  updateRequirement(
    params: Params<UpdateRequirementBodyDto>
  ): Result<UpdateRequirementSuccessResultDto> {
    return this.postForObject('/requirements/actions/update', params)
  }
  deleteRequirement(
    params: Params<DeleteRequirementBodyDto>
  ): Result<DeleteRequirementSuccessResultDto> {
    return this.postForObject('/requirements/actions/delete', params)
  }
  deleteRequirements(
    params: Params<DeleteRequirementsBodyDto>
  ): Result<DeleteRequirementsSuccessResultDto> {
    return this.postForObject('/requirements/actions/delete-many', params)
  }
  // Coverages
  async readCoverageExistsFlag(
    params: ReadCoverageExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadCoverageExistsFlagSuccessResultDto>(
        '/coverages/exists',
        params
      )
    ).exists
  }
  readCoveragesCount(
    params: Params<ReadCoveragesCountQueryDto>
  ): Result<ReadCoveragesCountSuccessResultDto> {
    return this.getObject('/coverages/count', params)
  }
  readCoverageVersion(
    params: Params<ReadCoverageVersionParamsDto>
  ): Result<ReadCoverageVersionSuccessResultDto> {
    return this.getObject(
      `/coverages/${params.id}/versions/${params.transitionNum}`
    )
  }
  readCoverageTransitionsCount(
    params: Params<ReadCoverageTransitionsCountParamsDto>,
    extra: Extra<ReadCoverageTransitionsCountQueryDto>
  ): Result<ReadCoverageTransitionsCountSuccessResultDto> {
    return this.getObject(`/coverages/${params.id}/transitions/count`, extra)
  }
  readCoverageTransitions(
    params: Params<ReadCoverageTransitionsParamsDto>,
    extra: Extra<ReadCoverageTransitionsQueryDto>
  ): Result<ReadCoverageTransitionsSuccessResultItemDto> {
    return this.getObject(`/coverages/${params.id}/transitions`, extra)
  }
  readCoverage<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadCoverageParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadCoverageQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadCoverageWithPrimaryPropsSuccessResultDto,
    ReadCoverageWithUpToSecondaryPropsSuccessResultDto,
    ReadCoverageWithUpToTertiaryPropsSuccessResultDto,
    ReadCoverageWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/coverages/${params.id}`, extra)
  }
  readCoverages<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadCoveragesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadCoveragesWithPrimaryPropsSuccessResultItemDto,
    ReadCoveragesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/coverages', params)
  }
  createCoverage(
    params: Params<CreateCoverageBodyDto>
  ): Result<CreateCoverageSuccessResultDto> {
    return this.postForObject('/coverages/actions/create', params)
  }
  updateCoverage(
    params: Params<UpdateCoverageBodyDto>
  ): Result<UpdateCoverageSuccessResultDto> {
    return this.postForObject('/coverages/actions/update', params)
  }
  deleteCoverage(
    params: Params<DeleteCoverageBodyDto>
  ): Result<DeleteCoverageSuccessResultDto> {
    return this.postForObject('/coverages/actions/delete', params)
  }
  deleteCoverages(
    params: Params<DeleteCoveragesBodyDto>
  ): Result<DeleteCoveragesSuccessResultDto> {
    return this.postForObject('/coverages/actions/delete-many', params)
  }
  // CommonTopologies
  async readCommonTopologyExistsFlag(
    params: ReadCommonTopologyExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadCommonTopologyExistsFlagSuccessResultDto>(
        '/common-topologies/exists',
        params
      )
    ).exists
  }
  readCommonTopologiesCount(
    params: Params<ReadCommonTopologiesCountQueryDto>
  ): Result<ReadCommonTopologiesCountSuccessResultDto> {
    return this.getObject('/common-topologies/count', params)
  }
  readCommonTopologyVersion(
    params: Params<ReadCommonTopologyVersionParamsDto>
  ): Result<ReadCommonTopologyVersionSuccessResultDto> {
    return this.getObject(
      `/common-topologies/${params.id}/versions/${params.transitionNum}`
    )
  }
  readCommonTopologyTransitionsCount(
    params: Params<ReadCommonTopologyTransitionsCountParamsDto>,
    extra: Extra<ReadCommonTopologyTransitionsCountQueryDto>
  ): Result<ReadCommonTopologyTransitionsCountSuccessResultDto> {
    return this.getObject(
      `/common-topologies/${params.id}/transitions/count`,
      extra
    )
  }
  readCommonTopologyTransitions(
    params: Params<ReadCommonTopologyTransitionsParamsDto>,
    extra: Extra<ReadCommonTopologyTransitionsQueryDto>
  ): Result<ReadCommonTopologyTransitionsSuccessResultItemDto> {
    return this.getObject(`/common-topologies/${params.id}/transitions`, extra)
  }
  readCommonTopology<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadCommonTopologyParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadCommonTopologyQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadCommonTopologyWithPrimaryPropsSuccessResultDto,
    ReadCommonTopologyWithUpToSecondaryPropsSuccessResultDto,
    ReadCommonTopologyWithUpToTertiaryPropsSuccessResultDto,
    ReadCommonTopologyWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/common-topologies/${params.id}`, extra)
  }
  readCommonTopologies<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadCommonTopologiesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadCommonTopologiesWithPrimaryPropsSuccessResultItemDto,
    ReadCommonTopologiesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/common-topologies', params)
  }
  createCommonTopology(
    params: Params<CreateCommonTopologyBodyDto>
  ): Result<CreateCommonTopologySuccessResultDto> {
    return this.postForObject('/common-topologies/actions/create', params)
  }
  updateCommonTopology(
    params: Params<UpdateCommonTopologyBodyDto>
  ): Result<UpdateCommonTopologySuccessResultDto> {
    return this.postForObject('/common-topologies/actions/update', params)
  }
  deleteCommonTopologyUnsafe(
    params: Params<DeleteCommonTopologyUnsafeBodyDto>
  ): Result<DeleteCommonTopologyUnsafeSuccessResultDto> {
    return this.postForObject(
      '/common-topologies/actions/delete-unsafe',
      params
    )
  }
  deleteCommonTopology(
    params: Params<DeleteCommonTopologyBodyDto>
  ): Result<DeleteCommonTopologySuccessResultDto> {
    return this.postForObject('/common-topologies/actions/delete', params)
  }
  deleteCommonTopologiesUnsafe(
    params: Params<DeleteCommonTopologiesUnsafeBodyDto>
  ): Result<DeleteCommonTopologiesUnsafeSuccessResultDto> {
    return this.postForObject(
      '/common-topologies/actions/delete-many-unsafe',
      params
    )
  }
  deleteCommonTopologies(
    params: Params<DeleteCommonTopologiesBodyDto>
  ): Result<DeleteCommonTopologiesSuccessResultDto> {
    return this.postForObject('/common-topologies/actions/delete-many', params)
  }
  // Topologies
  async readTopologyExistsFlag(
    params: ReadTopologyExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadTopologyExistsFlagSuccessResultDto>(
        '/topologies/exists',
        params
      )
    ).exists
  }
  readTopologiesCount(
    params: Params<ReadTopologiesCountQueryDto>
  ): Result<ReadTopologiesCountSuccessResultDto> {
    return this.getObject('/topologies/count', params)
  }
  readTopologyVersion(
    params: Params<ReadTopologyVersionParamsDto>
  ): Result<ReadTopologyVersionSuccessResultDto> {
    return this.getObject(
      `/topologies/${params.id}/versions/${params.transitionNum}`
    )
  }
  readTopologyTransitionsCount(
    params: Params<ReadTopologyTransitionsCountParamsDto>,
    extra: Extra<ReadTopologyTransitionsCountQueryDto>
  ): Result<ReadTopologyTransitionsCountSuccessResultDto> {
    return this.getObject(`/topologies/${params.id}/transitions/count`, extra)
  }
  readTopologyTransitions(
    params: Params<ReadTopologyTransitionsParamsDto>,
    extra: Extra<ReadTopologyTransitionsQueryDto>
  ): Result<ReadTopologyTransitionsSuccessResultItemDto> {
    return this.getObject(`/topologies/${params.id}/transitions`, extra)
  }
  readTopology<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTopologyParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTopologyQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTopologyWithPrimaryPropsSuccessResultDto,
    ReadTopologyWithUpToSecondaryPropsSuccessResultDto,
    ReadTopologyWithUpToTertiaryPropsSuccessResultDto,
    ReadTopologyWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/topologies/${params.id}`, extra)
  }
  readTopologies<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTopologiesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTopologiesWithPrimaryPropsSuccessResultItemDto,
    ReadTopologiesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/topologies', params)
  }
  createTopology(
    params: Params<CreateTopologyBodyDto>
  ): Result<CreateTopologySuccessResultDto> {
    return this.postForObject('/topologies/actions/create', params)
  }
  updateTopology(
    params: Params<UpdateTopologyBodyDto>
  ): Result<UpdateTopologySuccessResultDto> {
    return this.postForObject('/topologies/actions/update', params)
  }
  deleteTopology(
    params: Params<DeleteTopologyBodyDto>
  ): Result<DeleteTopologySuccessResultDto> {
    return this.postForObject('/topologies/actions/delete', params)
  }
  deleteTopologies(
    params: Params<DeleteTopologiesBodyDto>
  ): Result<DeleteTopologiesSuccessResultDto> {
    return this.postForObject('/topologies/actions/delete-many', params)
  }
  // Dsefs
  async readDsefExistsFlag(
    params: ReadDsefExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadDsefExistsFlagSuccessResultDto>(
        '/dsefs/exists',
        params
      )
    ).exists
  }
  readDsefsCount(
    params: Params<ReadDsefsCountQueryDto>
  ): Result<ReadDsefsCountSuccessResultDto> {
    return this.getObject('/dsefs/count', params)
  }
  readDsefVersionAdapter(
    params: Params<ReadDsefVersionAdapterParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/dsefs/${params.id}/versions/${params.transitionNum}/adapter`
    )
  }
  readDsefVersionNoAdapterConfig(
    params: Params<ReadDsefVersionNoAdapterConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/dsefs/${params.id}/versions/${params.transitionNum}/no-adapter-config`
    )
  }
  readDsefVersion(
    params: Params<ReadDsefVersionParamsDto>
  ): Result<ReadDsefVersionSuccessResultDto> {
    return this.getObject(
      `/dsefs/${params.id}/versions/${params.transitionNum}`
    )
  }
  readDsefTransitionsCount(
    params: Params<ReadDsefTransitionsCountParamsDto>,
    extra: Extra<ReadDsefTransitionsCountQueryDto>
  ): Result<ReadDsefTransitionsCountSuccessResultDto> {
    return this.getObject(`/dsefs/${params.id}/transitions/count`, extra)
  }
  readDsefTransitions(
    params: Params<ReadDsefTransitionsParamsDto>,
    extra: Extra<ReadDsefTransitionsQueryDto>
  ): Result<ReadDsefTransitionsSuccessResultItemDto> {
    return this.getObject(`/dsefs/${params.id}/transitions`, extra)
  }
  readDsefAdapter(params: Params<ReadDsefAdapterParamsDto>): Promise<Blob> {
    return this.getBlob(`/dsefs/${params.id}/adapter`)
  }
  readDsefNoAdapterConfig(
    params: Params<ReadDsefNoAdapterConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/dsefs/${params.id}/no-adapter-config`)
  }
  readDsef<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadDsefParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadDsefQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadDsefWithPrimaryPropsSuccessResultDto,
    ReadDsefWithUpToSecondaryPropsSuccessResultDto,
    ReadDsefWithUpToTertiaryPropsSuccessResultDto,
    ReadDsefWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/dsefs/${params.id}`, extra)
  }
  readDsefs<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadDsefsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadDsefsWithPrimaryPropsSuccessResultItemDto,
    ReadDsefsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/dsefs', params)
  }
  createDsef(
    main: Params<CreateDsefBodyMainDto>,
    adapter: File | undefined,
    noAdapterConfig: File | undefined
  ): Result<CreateDsefSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (adapter) {
      form.set('adapter', adapter)
    }
    if (noAdapterConfig) {
      form.set('noAdapterConfig', noAdapterConfig)
    }
    return this.postMultipartFormForObject('/dsefs/actions/create', form)
  }
  updateDsef(
    main: Params<UpdateDsefBodyMainDto>,
    adapter: File | undefined,
    noAdapterConfig: File | undefined
  ): Result<UpdateDsefSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (adapter) {
      form.set('adapter', adapter)
    }
    if (noAdapterConfig) {
      form.set('noAdapterConfig', noAdapterConfig)
    }
    return this.postMultipartFormForObject('/dsefs/actions/update', form)
  }
  deleteDsef(
    params: Params<DeleteDsefBodyDto>
  ): Result<DeleteDsefSuccessResultDto> {
    return this.postForObject('/dsefs/actions/delete', params)
  }
  deleteDsefs(
    params: Params<DeleteDsefsBodyDto>
  ): Result<DeleteDsefsSuccessResultDto> {
    return this.postForObject('/dsefs/actions/delete-many', params)
  }
  // Dbcs
  async readDbcExistsFlag(params: ReadDbcExistsFlagQueryDto): Promise<boolean> {
    return (
      await this.getObject<ReadDbcExistsFlagSuccessResultDto>(
        '/dbcs/exists',
        params
      )
    ).exists
  }
  readDbcsCount(
    params: Params<ReadDbcsCountQueryDto>
  ): Result<ReadDbcsCountSuccessResultDto> {
    return this.getObject('/dbcs/count', params)
  }
  readDbcVersionConfig(
    params: Params<ReadDbcVersionConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/dbcs/${params.id}/versions/${params.transitionNum}/config`
    )
  }
  readDbcVersionDsefConfig(
    params: Params<ReadDbcVersionDsefConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/dbcs/${params.id}/versions/${params.transitionNum}/dsefs/${params.dsefId}/config`
    )
  }
  readDbcVersion(
    params: Params<ReadDbcVersionParamsDto>
  ): Result<ReadDbcVersionSuccessResultDto> {
    return this.getObject(`/dbcs/${params.id}/versions/${params.transitionNum}`)
  }
  readDbcTransitionsCount(
    params: Params<ReadDbcTransitionsCountParamsDto>,
    extra: Extra<ReadDbcTransitionsCountQueryDto>
  ): Result<ReadDbcTransitionsCountSuccessResultDto> {
    return this.getObject(`/dbcs/${params.id}/transitions/count`, extra)
  }
  readDbcTransitions(
    params: Params<ReadDbcTransitionsParamsDto>,
    extra: Extra<ReadDbcTransitionsQueryDto>
  ): Result<ReadDbcTransitionsSuccessResultItemDto> {
    return this.getObject(`/dbcs/${params.id}/transitions`, extra)
  }
  readDbcConfig(params: Params<ReadDbcConfigParamsDto>): Promise<Blob> {
    return this.getBlob(`/dbcs/${params.id}/config`)
  }
  readDbcDsefConfig(params: Params<ReadDbcDsefConfigParamsDto>): Promise<Blob> {
    return this.getBlob(`/dbcs/${params.id}/dsefs/${params.dsefId}/config`)
  }
  readDbc<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadDbcParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadDbcQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadDbcWithPrimaryPropsSuccessResultDto,
    ReadDbcWithUpToSecondaryPropsSuccessResultDto,
    ReadDbcWithUpToTertiaryPropsSuccessResultDto,
    ReadDbcWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/dbcs/${params.id}`, extra)
  }
  readDbcs<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadDbcsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadDbcsWithPrimaryPropsSuccessResultItemDto,
    ReadDbcsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/dbcs', params)
  }
  createDbc(
    main: Params<CreateDbcBodyMainDto>,
    config: File | undefined,
    dsefConfigs: File[] | undefined
  ): Result<CreateDbcSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    if (dsefConfigs) {
      form.set('dsefConfigs', dsefConfigs)
    }
    return this.postMultipartFormForObject('/dbcs/actions/create', form)
  }
  updateDbc(
    main: Params<UpdateDbcBodyMainDto>,
    config: File | undefined,
    dsefConfigs: File[] | undefined
  ): Result<UpdateDbcSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    if (dsefConfigs) {
      form.set('dsefConfigs', dsefConfigs)
    }
    return this.postMultipartFormForObject('/dbcs/actions/update', form)
  }
  deleteDbc(
    params: Params<DeleteDbcBodyDto>
  ): Result<DeleteDbcSuccessResultDto> {
    return this.postForObject('/dbcs/actions/delete', params)
  }
  deleteDbcs(
    params: Params<DeleteDbcsBodyDto>
  ): Result<DeleteDbcsSuccessResultDto> {
    return this.postForObject('/dbcs/actions/delete-many', params)
  }
  // TestTemplates
  async readTestTemplateExistsFlag(
    params: ReadTestTemplateExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadTestTemplateExistsFlagSuccessResultDto>(
        '/test-templates/exists',
        params
      )
    ).exists
  }
  readTestTemplatesCount(
    params: Params<ReadTestTemplatesCountQueryDto>
  ): Result<ReadTestTemplatesCountSuccessResultDto> {
    return this.getObject('/test-templates/count', params)
  }
  readTestTemplateVersionConfig(
    params: Params<ReadTestTemplateVersionConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/test-templates/${params.id}/versions/${params.transitionNum}/config`
    )
  }
  readTestTemplateVersion(
    params: Params<ReadTestTemplateVersionParamsDto>
  ): Result<ReadTestTemplateVersionSuccessResultDto> {
    return this.getObject(
      `/test-templates/${params.id}/versions/${params.transitionNum}`
    )
  }
  readTestTemplateTransitionsCount(
    params: Params<ReadTestTemplateTransitionsCountParamsDto>,
    extra: Extra<ReadTestTemplateTransitionsCountQueryDto>
  ): Result<ReadTestTemplateTransitionsCountSuccessResultDto> {
    return this.getObject(
      `/test-templates/${params.id}/transitions/count`,
      extra
    )
  }
  readTestTemplateTransitions(
    params: Params<ReadTestTemplateTransitionsParamsDto>,
    extra: Extra<ReadTestTemplateTransitionsQueryDto>
  ): Result<ReadTestTemplateTransitionsSuccessResultItemDto> {
    return this.getObject(`/test-templates/${params.id}/transitions`, extra)
  }
  readTestTemplateConfig(
    params: Params<ReadTestTemplateConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/test-templates/${params.id}/config`)
  }
  readTestTemplate<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTestTemplateParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTestTemplateQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTestTemplateWithPrimaryPropsSuccessResultDto,
    ReadTestTemplateWithUpToSecondaryPropsSuccessResultDto,
    ReadTestTemplateWithUpToTertiaryPropsSuccessResultDto,
    ReadTestTemplateWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/test-templates/${params.id}`, extra)
  }
  readTestTemplates<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTestTemplatesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTestTemplatesWithPrimaryPropsSuccessResultItemDto,
    ReadTestTemplatesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/test-templates', params)
  }
  createTestTemplate(
    main: Params<CreateTestTemplateBodyMainDto>,
    config: File | undefined
  ): Result<CreateTestTemplateSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    return this.postMultipartFormForObject(
      '/test-templates/actions/create',
      form
    )
  }
  updateTestTemplate(
    main: Params<UpdateTestTemplateBodyMainDto>,
    config: File | undefined
  ): Result<UpdateTestTemplateSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    return this.postMultipartFormForObject(
      '/test-templates/actions/update',
      form
    )
  }
  deleteTestTemplate(
    params: Params<DeleteTestTemplateBodyDto>
  ): Result<DeleteTestTemplateSuccessResultDto> {
    return this.postForObject('/test-templates/actions/delete', params)
  }
  deleteTestTemplates(
    params: Params<DeleteTestTemplatesBodyDto>
  ): Result<DeleteTestTemplatesSuccessResultDto> {
    return this.postForObject('/test-templates/actions/delete-many', params)
  }
  // Tests
  async readTestExistsFlag(
    params: ReadTestExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadTestExistsFlagSuccessResultDto>(
        '/tests/exists',
        params
      )
    ).exists
  }
  readTestsCount(
    params: Params<ReadTestsCountQueryDto>
  ): Result<ReadTestsCountSuccessResultDto> {
    return this.getObject('/tests/count', params)
  }
  readTestVersionConfig(
    params: Params<ReadTestVersionConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/tests/${params.id}/versions/${params.transitionNum}/config`
    )
  }
  readTestVersionDelta(
    params: Params<ReadTestVersionDeltaParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/tests/${params.id}/versions/${params.transitionNum}/vertexes/${params.vertexName}/delta`
    )
  }
  readTestVersionDeltaDsefConfig(
    params: Params<ReadTestVersionDeltaDsefConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/tests/${params.id}/versions/${params.transitionNum}/vertexes/${params.vertexName}/dsefs/${params.dsefId}/config`
    )
  }
  readTestVersion(
    params: Params<ReadTestVersionParamsDto>
  ): Result<ReadTestVersionSuccessResultDto> {
    return this.getObject(
      `/tests/${params.id}/versions/${params.transitionNum}`
    )
  }
  readTestTransitionsCount(
    params: Params<ReadTestTransitionsCountParamsDto>,
    extra: Extra<ReadTestTransitionsCountQueryDto>
  ): Result<ReadTestTransitionsCountSuccessResultDto> {
    return this.getObject(`/tests/${params.id}/transitions/count`, extra)
  }
  readTestTransitions(
    params: Params<ReadTestTransitionsParamsDto>,
    extra: Extra<ReadTestTransitionsQueryDto>
  ): Result<ReadTestTransitionsSuccessResultItemDto> {
    return this.getObject(`/tests/${params.id}/transitions`, extra)
  }
  readTestConfig(params: Params<ReadTestConfigParamsDto>): Promise<Blob> {
    return this.getBlob(`/tests/${params.id}/config`)
  }
  readTestDelta(params: Params<ReadTestDeltaParamsDto>): Promise<Blob> {
    return this.getBlob(
      `/tests/${params.id}/vertexes/${params.vertexName}/delta`
    )
  }
  readTestDeltaDsefConfig(
    params: Params<ReadTestDeltaDsefConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/tests/${params.id}/vertexes/${params.vertexName}/dsefs/${params.dsefId}/config`
    )
  }
  readTest<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTestParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTestQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTestWithPrimaryPropsSuccessResultDto,
    ReadTestWithUpToSecondaryPropsSuccessResultDto,
    ReadTestWithUpToTertiaryPropsSuccessResultDto,
    ReadTestWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/tests/${params.id}`, extra)
  }
  readTests<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTestsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTestsWithPrimaryPropsSuccessResultItemDto,
    ReadTestsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/tests', params)
  }
  createTest(
    main: Params<CreateTestBodyMainDto>,
    config: File | undefined,
    deltas: File[] | undefined,
    dsefConfigs: File[] | undefined
  ): Result<CreateTestSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    if (deltas) {
      form.set('deltas', deltas)
    }
    if (dsefConfigs) {
      form.set('dsefConfigs', dsefConfigs)
    }
    return this.postMultipartFormForObject('/tests/actions/create', form)
  }
  updateTest(
    main: Params<UpdateTestBodyMainDto>,
    config: File | undefined,
    deltas: File[] | undefined,
    dsefConfigs: File[] | undefined
  ): Result<UpdateTestSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    if (deltas) {
      form.set('deltas', deltas)
    }
    if (dsefConfigs) {
      form.set('dsefConfigs', dsefConfigs)
    }
    return this.postMultipartFormForObject('/tests/actions/update', form)
  }
  deleteTest(
    params: Params<DeleteTestBodyDto>
  ): Result<DeleteTestSuccessResultDto> {
    return this.postForObject('/tests/actions/delete', params)
  }
  deleteTests(
    params: Params<DeleteTestsBodyDto>
  ): Result<DeleteTestsSuccessResultDto> {
    return this.postForObject('/tests/actions/delete-many', params)
  }
  // Subgroups
  async readSubgroupExistsFlag(
    params: ReadSubgroupExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadSubgroupExistsFlagSuccessResultDto>(
        '/subgroups/exists',
        params
      )
    ).exists
  }
  readSubgroupsCount(
    params: Params<ReadSubgroupsCountQueryDto>
  ): Result<ReadSubgroupsCountSuccessResultDto> {
    return this.getObject('/subgroups/count', params)
  }
  readSubgroupVersion(
    params: Params<ReadSubgroupVersionParamsDto>
  ): Result<ReadSubgroupVersionSuccessResultDto> {
    return this.getObject(
      `/subgroups/${params.id}/versions/${params.transitionNum}`
    )
  }
  readSubgroupTransitionsCount(
    params: Params<ReadSubgroupTransitionsCountParamsDto>,
    extra: Extra<ReadSubgroupTransitionsCountQueryDto>
  ): Result<ReadSubgroupTransitionsCountSuccessResultDto> {
    return this.getObject(`/subgroups/${params.id}/transitions/count`, extra)
  }
  readSubgroupTransitions(
    params: Params<ReadSubgroupTransitionsParamsDto>,
    extra: Extra<ReadSubgroupTransitionsQueryDto>
  ): Result<ReadSubgroupTransitionsSuccessResultItemDto> {
    return this.getObject(`/subgroups/${params.id}/transitions`, extra)
  }
  readSubgroup<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadSubgroupParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadSubgroupQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadSubgroupWithPrimaryPropsSuccessResultDto,
    ReadSubgroupWithUpToSecondaryPropsSuccessResultDto,
    ReadSubgroupWithUpToTertiaryPropsSuccessResultDto,
    ReadSubgroupWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/subgroups/${params.id}`, extra)
  }
  readSubgroups<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadSubgroupsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadSubgroupsWithPrimaryPropsSuccessResultItemDto,
    ReadSubgroupsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/subgroups', params)
  }
  createSubgroup(
    params: Params<CreateSubgroupBodyDto>
  ): Result<CreateSubgroupSuccessResultDto> {
    return this.postForObject('/subgroups/actions/create', params)
  }
  updateSubgroup(
    params: Params<UpdateSubgroupBodyDto>
  ): Result<UpdateSubgroupSuccessResultDto> {
    return this.postForObject('/subgroups/actions/update', params)
  }
  deleteSubgroup(
    params: Params<DeleteSubgroupBodyDto>
  ): Result<DeleteSubgroupSuccessResultDto> {
    return this.postForObject('/subgroups/actions/delete', params)
  }
  deleteSubgroups(
    params: Params<DeleteSubgroupsBodyDto>
  ): Result<DeleteSubgroupsSuccessResultDto> {
    return this.postForObject('/subgroups/actions/delete-many', params)
  }
  // Groups
  async readGroupExistsFlag(
    params: ReadGroupExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadGroupExistsFlagSuccessResultDto>(
        '/groups/exists',
        params
      )
    ).exists
  }
  readGroupsCount(
    params: Params<ReadGroupsCountQueryDto>
  ): Result<ReadGroupsCountSuccessResultDto> {
    return this.getObject('/groups/count', params)
  }
  readGroupVersion(
    params: Params<ReadGroupVersionParamsDto>
  ): Result<ReadGroupVersionSuccessResultDto> {
    return this.getObject(
      `/groups/${params.id}/versions/${params.transitionNum}`
    )
  }
  readGroupTransitionsCount(
    params: Params<ReadGroupTransitionsCountParamsDto>,
    extra: Extra<ReadGroupTransitionsCountQueryDto>
  ): Result<ReadGroupTransitionsCountSuccessResultDto> {
    return this.getObject(`/groups/${params.id}/transitions/count`, extra)
  }
  readGroupTransitions(
    params: Params<ReadGroupTransitionsParamsDto>,
    extra: Extra<ReadGroupTransitionsQueryDto>
  ): Result<ReadGroupTransitionsSuccessResultItemDto> {
    return this.getObject(`/groups/${params.id}/transitions`, extra)
  }
  readGroup<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadGroupParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadGroupQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadGroupWithPrimaryPropsSuccessResultDto,
    ReadGroupWithUpToSecondaryPropsSuccessResultDto,
    ReadGroupWithUpToTertiaryPropsSuccessResultDto,
    ReadGroupWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/groups/${params.id}`, extra)
  }
  readGroups<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadGroupsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadGroupsWithPrimaryPropsSuccessResultItemDto,
    ReadGroupsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/groups', params)
  }
  createGroup(
    params: Params<CreateGroupBodyDto>
  ): Result<CreateGroupSuccessResultDto> {
    return this.postForObject('/groups/actions/create', params)
  }
  updateGroup(
    params: Params<UpdateGroupBodyDto>
  ): Result<UpdateGroupSuccessResultDto> {
    return this.postForObject('/groups/actions/update', params)
  }
  deleteGroup(
    params: Params<DeleteGroupBodyDto>
  ): Result<DeleteGroupSuccessResultDto> {
    return this.postForObject('/groups/actions/delete', params)
  }
  deleteGroups(
    params: Params<DeleteGroupsBodyDto>
  ): Result<DeleteGroupsSuccessResultDto> {
    return this.postForObject('/groups/actions/delete-many', params)
  }
  // Devices
  async readDeviceExistsFlag(
    params: ReadDeviceExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadDeviceExistsFlagSuccessResultDto>(
        '/devices/exists',
        params
      )
    ).exists
  }
  readDevicesCount(
    params: Params<ReadDevicesCountQueryDto>
  ): Result<ReadDevicesCountSuccessResultDto> {
    return this.getObject('/devices/count', params)
  }
  readDeviceVersionConfig(
    params: Params<ReadDeviceVersionConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/versions/${params.transitionNum}/config`
    )
  }
  readDeviceVersionClearConfig(
    params: Params<ReadDeviceVersionClearConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/versions/${params.transitionNum}/clear-config`
    )
  }
  readDeviceVersionAccessConfig(
    params: Params<ReadDeviceVersionAccessConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/versions/${params.transitionNum}/access-config`
    )
  }
  readDeviceVersionDsefClearConfig(
    params: Params<ReadDeviceVersionDsefClearConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/versions/${params.transitionNum}/dsefs/${params.dsefId}/clear-config`
    )
  }
  readDeviceVersionDsefAccessConfig(
    params: Params<ReadDeviceVersionDsefAccessConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/versions/${params.transitionNum}/dsefs/${params.dsefId}/access-config`
    )
  }
  readDeviceVersion(
    params: Params<ReadDeviceVersionParamsDto>
  ): Result<ReadDeviceVersionSuccessResultDto> {
    return this.getObject(
      `/devices/${params.id}/versions/${params.transitionNum}`
    )
  }
  readDeviceTransitionsCount(
    params: Params<ReadDeviceTransitionsCountParamsDto>,
    extra: Extra<ReadDeviceTransitionsCountQueryDto>
  ): Result<ReadDeviceTransitionsCountSuccessResultDto> {
    return this.getObject(`/devices/${params.id}/transitions/count`, extra)
  }
  readDeviceTransitions(
    params: Params<ReadDeviceTransitionsParamsDto>,
    extra: Extra<ReadDeviceTransitionsQueryDto>
  ): Result<ReadDeviceTransitionsSuccessResultItemDto> {
    return this.getObject(`/devices/${params.id}/transitions`, extra)
  }
  readDeviceConfig(params: Params<ReadDeviceConfigParamsDto>): Promise<Blob> {
    return this.getBlob(`/devices/${params.id}/config`)
  }
  readDeviceClearConfig(
    params: Params<ReadDeviceClearConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/devices/${params.id}/clear-config`)
  }
  readDeviceAccessConfig(
    params: Params<ReadDeviceAccessConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/devices/${params.id}/access-config`)
  }
  readDeviceDsefClearConfig(
    params: Params<ReadDeviceDsefClearConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/dsefs/${params.dsefId}/clear-config`
    )
  }
  readDeviceDsefAccessConfig(
    params: Params<ReadDeviceDsefAccessConfigParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/devices/${params.id}/dsefs/${params.dsefId}/access-config`
    )
  }
  readDevice<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadDeviceParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadDeviceQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadDeviceWithPrimaryPropsSuccessResultDto,
    ReadDeviceWithUpToSecondaryPropsSuccessResultDto,
    ReadDeviceWithUpToTertiaryPropsSuccessResultDto,
    ReadDeviceWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/devices/${params.id}`, extra)
  }
  readDevices<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadDevicesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadDevicesWithPrimaryPropsSuccessResultItemDto,
    ReadDevicesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/devices', params)
  }
  createDevice(
    main: Params<CreateDeviceBodyMainDto>,
    config: File | undefined,
    clearConfig: File | undefined,
    accessConfig: File | undefined,
    dsefClearConfigs: File[] | undefined,
    dsefAccessConfigs: File[] | undefined
  ): Result<CreateDeviceSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    if (clearConfig) {
      form.set('clearConfig', clearConfig)
    }
    if (accessConfig) {
      form.set('accessConfig', accessConfig)
    }
    if (dsefClearConfigs) {
      form.set('dsefClearConfigs', dsefClearConfigs)
    }
    if (dsefAccessConfigs) {
      form.set('dsefAccessConfigs', dsefAccessConfigs)
    }
    return this.postMultipartFormForObject('/devices/actions/create', form)
  }
  updateDevice(
    main: Params<UpdateDeviceBodyMainDto>,
    config: File | undefined,
    clearConfig: File | undefined,
    accessConfig: File | undefined,
    dsefClearConfigs: File[] | undefined,
    dsefAccessConfigs: File[] | undefined
  ): Result<UpdateDeviceSuccessResultDto> {
    const form = new Map<string, MultipartFormVal>([['main', main]])
    if (config) {
      form.set('config', config)
    }
    if (clearConfig) {
      form.set('clearConfig', clearConfig)
    }
    if (accessConfig) {
      form.set('accessConfig', accessConfig)
    }
    if (dsefClearConfigs) {
      form.set('dsefClearConfigs', dsefClearConfigs)
    }
    if (dsefAccessConfigs) {
      form.set('dsefAccessConfigs', dsefAccessConfigs)
    }
    return this.postMultipartFormForObject('/devices/actions/update', form)
  }
  deleteDevice(
    params: Params<DeleteDeviceBodyDto>
  ): Result<DeleteDeviceSuccessResultDto> {
    return this.postForObject('/devices/actions/delete', params)
  }
  deleteDevices(
    params: Params<DeleteDevicesBodyDto>
  ): Result<DeleteDevicesSuccessResultDto> {
    return this.postForObject('/devices/actions/delete-many', params)
  }
  // Tasks
  readTasksCount(
    params: Params<ReadTasksCountQueryDto>
  ): Result<ReadTasksCountSuccessResultDto> {
    return this.getObject('/tasks/count', params)
  }
  readTestToExecute(): Promise<Blob> {
    return this.getBlob(`/tasks/test-to-execute`)
  }
  readTaskVersion(
    params: Params<ReadTaskVersionParamsDto>
  ): Result<ReadTaskVersionSuccessResultDto> {
    return this.getObject(
      `/tasks/${params.id}/versions/${params.transitionNum}`
    )
  }
  readTaskTransitionsCount(
    params: Params<ReadTaskTransitionsCountParamsDto>,
    extra: Extra<ReadTaskTransitionsCountQueryDto>
  ): Result<ReadTaskTransitionsCountSuccessResultDto> {
    return this.getObject(`/tasks/${params.id}/transitions/count`, extra)
  }
  readTaskTransitions(
    params: Params<ReadTaskTransitionsParamsDto>,
    extra: Extra<ReadTaskTransitionsQueryDto>
  ): Result<ReadTaskTransitionsSuccessResultItemDto> {
    return this.getObject(`/tasks/${params.id}/transitions`, extra)
  }
  readTask<ScopeWrap extends ReadOneChangeableScopeWrap>(
    params: Params<ReadTaskParamsDto>,
    extra: ReadOneChangeableExtra<ScopeWrap, ReadTaskQueryDto>
  ): ReadOneChangeableResult<
    ScopeWrap,
    ReadTaskWithPrimaryPropsSuccessResultDto,
    ReadTaskWithUpToSecondaryPropsSuccessResultDto,
    ReadTaskWithUpToTertiaryPropsSuccessResultDto,
    ReadTaskWithAllPropsSuccessResultDto,
    ReadTaskWithChangeablePrimaryPropsSuccessResultDto,
    ReadTaskWithChangeableUpToSecondaryPropsSuccessResultDto,
    ReadTaskWithChangeableUpToTertiaryPropsSuccessResultDto,
    ReadTaskWithChangeableAllPropsSuccessResultDto
  > {
    return this.getObject(`/tasks/${params.id}`, extra)
  }
  readTasks<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTasksQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTasksWithPrimaryPropsSuccessResultItemDto,
    ReadTasksWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/tasks', params)
  }
  createTask(
    params: Params<CreateTaskBodyDto>
  ): Result<CreateTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/create', params)
  }
  updateTask(
    params: Params<UpdateTaskBodyDto>
  ): Result<UpdateTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/update', params)
  }
  cancelTask(
    params: Params<CancelTaskBodyDto>
  ): Result<CancelTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/cancel', params)
  }
  abortTask(
    params: Params<AbortTaskBodyDto>
  ): Result<AbortTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/abort', params)
  }
  pauseTask(
    params: Params<PauseTaskBodyDto>
  ): Result<PauseTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/pause', params)
  }
  unpauseTask(
    params: Params<UnpauseTaskBodyDto>
  ): Result<UnpauseTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/unpause', params)
  }
  deleteTask(
    params: Params<DeleteTaskBodyDto>
  ): Result<DeleteTaskSuccessResultDto> {
    return this.postForObject('/tasks/actions/delete', params)
  }
  deleteTasks(
    params: Params<DeleteTasksBodyDto>
  ): Result<DeleteTasksSuccessResultDto> {
    return this.postForObject('/tasks/actions/delete-many', params)
  }
  // TaskTemplates
  async readTaskTemplateExistsFlag(
    params: ReadTaskTemplateExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadTaskTemplateExistsFlagSuccessResultDto>(
        '/task-templates/exists',
        params
      )
    ).exists
  }
  readTaskTemplatesCount(
    params: Params<ReadTaskTemplatesCountQueryDto>
  ): Result<ReadTaskTemplatesCountSuccessResultDto> {
    return this.getObject('/task-templates/count', params)
  }
  readTaskTemplateVersion(
    params: Params<ReadTaskTemplateVersionParamsDto>
  ): Result<ReadTaskTemplateVersionSuccessResultDto> {
    return this.getObject(
      `/task-templates/${params.id}/versions/${params.transitionNum}`
    )
  }
  readTaskTemplateTransitionsCount(
    params: Params<ReadTaskTemplateTransitionsCountParamsDto>,
    extra: Extra<ReadTaskTemplateTransitionsCountQueryDto>
  ): Result<ReadTaskTemplateTransitionsCountSuccessResultDto> {
    return this.getObject(
      `/task-templates/${params.id}/transitions/count`,
      extra
    )
  }
  readTaskTemplateTransitions(
    params: Params<ReadTaskTemplateTransitionsParamsDto>,
    extra: Extra<ReadTaskTemplateTransitionsQueryDto>
  ): Result<ReadTaskTemplateTransitionsSuccessResultItemDto> {
    return this.getObject(`/task-templates/${params.id}/transitions`, extra)
  }
  readTaskTemplate<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTaskTemplateParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTaskTemplateQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTaskTemplateWithPrimaryPropsSuccessResultDto,
    ReadTaskTemplateWithUpToSecondaryPropsSuccessResultDto,
    ReadTaskTemplateWithUpToTertiaryPropsSuccessResultDto,
    ReadTaskTemplateWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/task-templates/${params.id}`, extra)
  }
  readTaskTemplates<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTaskTemplatesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTaskTemplatesWithPrimaryPropsSuccessResultItemDto,
    ReadTaskTemplatesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/task-templates', params)
  }
  createTaskTemplate(
    params: Params<CreateTaskTemplateBodyDto>
  ): Result<CreateTaskTemplateSuccessResultDto> {
    return this.postForObject('/task-templates/actions/create', params)
  }
  updateTaskTemplate(
    params: Params<UpdateTaskTemplateBodyDto>
  ): Result<UpdateTaskTemplateSuccessResultDto> {
    return this.postForObject('/task-templates/actions/update', params)
  }
  deleteTaskTemplate(
    params: Params<DeleteTaskTemplateBodyDto>
  ): Result<DeleteTaskTemplateSuccessResultDto> {
    return this.postForObject('/task-templates/actions/delete', params)
  }
  deleteTaskTemplates(
    params: Params<DeleteTaskTemplatesBodyDto>
  ): Result<DeleteTaskTemplatesSuccessResultDto> {
    return this.postForObject('/task-templates/actions/delete-many', params)
  }
  // TestReports
  readTestReportsCount(
    params: Params<ReadTestReportsCountQueryDto>
  ): Result<ReadTestReportsCountSuccessResultDto> {
    return this.getObject('/test-reports/count', params)
  }
  readTestReportItemData(
    params: Params<ReadTestReportItemDataParamsDto>
  ): Promise<Blob> {
    return this.getBlob(`/test-reports/${params.id}/items/${params.itemId}`)
  }
  readTestReportItemDataExtra(
    params: Params<ReadTestReportItemDataExtraParamsDto>
  ): Promise<Blob> {
    return this.getBlob(
      `/test-reports/${params.taskId}/${params.testId}/items/${params.itemId}`
    )
  }
  readTestReportExtra<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTestReportExtraParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTestReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTestReportWithPrimaryPropsSuccessResultDto,
    ReadTestReportWithUpToSecondaryPropsSuccessResultDto,
    ReadTestReportWithUpToTertiaryPropsSuccessResultDto,
    ReadTestReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(
      `/test-reports/${params.taskId}/${params.testId}`,
      extra
    )
  }
  readTestReport<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTestReportParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTestReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTestReportWithPrimaryPropsSuccessResultDto,
    ReadTestReportWithUpToSecondaryPropsSuccessResultDto,
    ReadTestReportWithUpToTertiaryPropsSuccessResultDto,
    ReadTestReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/test-reports/${params.id}`, extra)
  }
  readTestReports<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTestReportsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTestReportsWithPrimaryPropsSuccessResultItemDto,
    ReadTestReportsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/test-reports', params)
  }
  launchTest(
    params: Params<LaunchTestBodyDto>
  ): Result<LaunchTestSuccessResultDto> {
    return this.postForObject('/test-reports/actions/launch-test', params)
  }
  finishTestAsPassed(
    params: Params<FinishTestAsPassedBodyDto>
  ): Result<FinishTestAsPassedSuccessResultDto> {
    return this.postForObject(
      '/test-reports/actions/finish-test-as-passed',
      params
    )
  }
  finishTestAsFailed(
    params: Params<FinishTestAsFailedBodyDto>
  ): Result<FinishTestAsFailedSuccessResultDto> {
    return this.postForObject(
      '/test-reports/actions/finish-test-as-failed',
      params
    )
  }
  finishTestAsError(
    params: Params<FinishTestAsErrorBodyDto>
  ): Result<FinishTestAsErrorSuccessResultDto> {
    return this.postForObject(
      '/test-reports/actions/finish-test-as-error',
      params
    )
  }
  createTestReportMessage(
    params: Params<CreateTestReportMessageBodyDto>
  ): Result<CreateTestReportMessageSuccessResultDto> {
    return this.postForObject('/test-reports/actions/create-message', params)
  }
  createTestReportMessages(
    params: Params<CreateTestReportMessagesBodyDto>
  ): Result<CreateTestReportMessagesSuccessResultDto> {
    return this.postForObject('/test-reports/actions/create-messages', params)
  }
  createTestReportItem(
    main: Params<CreateTestReportItemBodyMainDto>,
    itemData: File
  ): Result<CreateTestReportItemSuccessResultDto> {
    return this.postMultipartFormForObject(
      '/test-reports/actions/create-item',
      new Map<string, MultipartFormVal>([
        ['main', main],
        ['itemData', itemData]
      ])
    )
  }
  createTestReportItems(
    main: Params<CreateTestReportItemsBodyMainDto>,
    itemDatas: File[]
  ): Result<CreateTestReportItemsSuccessResultDto> {
    return this.postMultipartFormForObject(
      '/test-reports/actions/create-items',
      new Map<string, MultipartFormVal>([
        ['main', main],
        ['itemDatas', itemDatas]
      ])
    )
  }
  deleteTestReportItemUnsafe(
    params: Params<DeleteTestReportItemUnsafeBodyDto>
  ): Result<DeleteTestReportItemUnsafeSuccessResultDto> {
    return this.postForObject(
      '/test-reports/actions/delete-item-unsafe',
      params
    )
  }
  deleteTestReportItemsUnsafe(
    params: Params<DeleteTestReportItemsUnsafeBodyDto>
  ): Result<DeleteTestReportItemsUnsafeSuccessResultDto> {
    return this.postForObject(
      '/test-reports/actions/delete-items-unsafe',
      params
    )
  }
  // SubgroupReports
  readSubgroupReportsCount(
    params: Params<ReadSubgroupReportsCountQueryDto>
  ): Result<ReadSubgroupReportsCountSuccessResultDto> {
    return this.getObject('/subgroup-reports/count', params)
  }
  readSubgroupReportExtra<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadSubgroupReportExtraParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadSubgroupReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadSubgroupReportWithPrimaryPropsSuccessResultDto,
    ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto,
    ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto,
    ReadSubgroupReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(
      `/subgroup-reports/${params.taskId}/${params.subgroupId}`,
      extra
    )
  }
  readSubgroupReport<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadSubgroupReportParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadSubgroupReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadSubgroupReportWithPrimaryPropsSuccessResultDto,
    ReadSubgroupReportWithUpToSecondaryPropsSuccessResultDto,
    ReadSubgroupReportWithUpToTertiaryPropsSuccessResultDto,
    ReadSubgroupReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/subgroup-reports/${params.id}`, extra)
  }
  readSubgroupReports<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadSubgroupReportsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadSubgroupReportsWithPrimaryPropsSuccessResultItemDto,
    ReadSubgroupReportsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/subgroup-reports', params)
  }
  // GroupReports
  readGroupReportsCount(
    params: Params<ReadGroupReportsCountQueryDto>
  ): Result<ReadGroupReportsCountSuccessResultDto> {
    return this.getObject('/group-reports/count', params)
  }
  readGroupReportExtra<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadGroupReportExtraParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadGroupReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadGroupReportWithPrimaryPropsSuccessResultDto,
    ReadGroupReportWithUpToSecondaryPropsSuccessResultDto,
    ReadGroupReportWithUpToTertiaryPropsSuccessResultDto,
    ReadGroupReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(
      `/group-reports/${params.taskId}/${params.groupId}`,
      extra
    )
  }
  readGroupReport<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadGroupReportParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadGroupReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadGroupReportWithPrimaryPropsSuccessResultDto,
    ReadGroupReportWithUpToSecondaryPropsSuccessResultDto,
    ReadGroupReportWithUpToTertiaryPropsSuccessResultDto,
    ReadGroupReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/group-reports/${params.id}`, extra)
  }
  readGroupReports<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadGroupReportsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadGroupReportsWithPrimaryPropsSuccessResultItemDto,
    ReadGroupReportsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/group-reports', params)
  }
  // TaskReports
  readTaskReportsCount(
    params: Params<ReadTaskReportsCountQueryDto>
  ): Result<ReadTaskReportsCountSuccessResultDto> {
    return this.getObject('/task-reports/count', params)
  }
  readTaskReport<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadTaskReportParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadTaskReportQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadTaskReportWithPrimaryPropsSuccessResultDto,
    ReadTaskReportWithUpToSecondaryPropsSuccessResultDto,
    ReadTaskReportWithUpToTertiaryPropsSuccessResultDto,
    ReadTaskReportWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/task-reports/${params.id}`, extra)
  }
  readTaskReports<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadTaskReportsQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadTaskReportsWithPrimaryPropsSuccessResultItemDto,
    ReadTaskReportsWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/task-reports', params)
  }
  // Slices
  async readSliceExistsFlag(
    params: ReadSliceExistsFlagQueryDto
  ): Promise<boolean> {
    return (
      await this.getObject<ReadSliceExistsFlagSuccessResultDto>(
        '/slices/exists',
        params
      )
    ).exists
  }
  readSlicesCount(
    params: Params<ReadSlicesCountQueryDto>
  ): Result<ReadSlicesCountSuccessResultDto> {
    return this.getObject('/slices/count', params)
  }
  readSliceVersion(
    params: Params<ReadSliceVersionParamsDto>
  ): Result<ReadSliceVersionSuccessResultDto> {
    return this.getObject(
      `/slices/${params.id}/versions/${params.transitionNum}`
    )
  }
  readSliceTransitionsCount(
    params: Params<ReadSliceTransitionsCountParamsDto>,
    extra: Extra<ReadSliceTransitionsCountQueryDto>
  ): Result<ReadSliceTransitionsCountSuccessResultDto> {
    return this.getObject(`/slices/${params.id}/transitions/count`, extra)
  }
  readSliceTransitions(
    params: Params<ReadSliceTransitionsParamsDto>,
    extra: Extra<ReadSliceTransitionsQueryDto>
  ): Result<ReadSliceTransitionsSuccessResultItemDto> {
    return this.getObject(`/slices/${params.id}/transitions`, extra)
  }
  readSlice<ScopeWrap extends ReadOneScopeWrap>(
    params: Params<ReadSliceParamsDto>,
    extra: ReadOneExtra<ScopeWrap, ReadSliceQueryDto>
  ): ReadOneResult<
    ScopeWrap,
    ReadSliceWithPrimaryPropsSuccessResultDto,
    ReadSliceWithUpToSecondaryPropsSuccessResultDto,
    ReadSliceWithUpToTertiaryPropsSuccessResultDto,
    ReadSliceWithAllPropsSuccessResultDto
  > {
    return this.getObject(`/slices/${params.id}`, extra)
  }
  readSlices<ScopeWrap extends ReadManyScopeWrap>(
    params: ReadManyParams<ScopeWrap, ReadSlicesQueryDto>
  ): ReadManyResult<
    ScopeWrap,
    ReadSlicesWithPrimaryPropsSuccessResultItemDto,
    ReadSlicesWithUpToSecondaryPropsSuccessResultItemDto
  > {
    return this.getObject('/slices', params)
  }
  createSlice(
    params: Params<CreateSliceBodyDto>
  ): Result<CreateSliceSuccessResultDto> {
    return this.postForObject('/slices/actions/create', params)
  }
  updateSlice(
    params: Params<UpdateSliceBodyDto>
  ): Result<UpdateSliceSuccessResultDto> {
    return this.postForObject('/slices/actions/update', params)
  }
  deleteSlice(
    params: Params<DeleteSliceBodyDto>
  ): Result<DeleteSliceSuccessResultDto> {
    return this.postForObject('/slices/actions/delete', params)
  }
  deleteSlices(
    params: Params<DeleteSlicesBodyDto>
  ): Result<DeleteSlicesSuccessResultDto> {
    return this.postForObject('/slices/actions/delete-many', params)
  }
  // Subscriptions
  subscribeToSelfMeta(
    handler?: (data: SubscribeToResourceDataDto) => void
  ): SubscriptionIdWrapDto {
    const subscriptionId = this.getUniqueSubscriptionId()
    this.addSubscriptionBlock({
      subscriptionId: subscriptionId,
      type: 'SELF_META',
      handler: handler
    })
    return { subscriptionId: subscriptionId }
  }
  subscribeToResource(
    params: DtoWithoutEnums<SubscribeToResourceParamsDto>,
    handler?: (data: SubscribeToResourceDataDto) => void
  ): SubscriptionIdWrapDto {
    const subscriptionId = this.getUniqueSubscriptionId()
    this.addSubscriptionBlock({
      subscriptionId: subscriptionId,
      type: 'RESOURCE',
      params: params,
      handler: handler
    })
    return { subscriptionId: subscriptionId }
  }
  subscribeToResources(
    params: DtoWithoutEnums<SubscribeToResourcesParamsDto>,
    handler?: (data: SubscribeToResourcesDataDto) => void
  ): SubscriptionIdWrapDto {
    const subscriptionId = this.getUniqueSubscriptionId()
    this.addSubscriptionBlock({
      subscriptionId: subscriptionId,
      type: 'RESOURCES',
      params: params,
      handler: handler
    })
    return { subscriptionId: subscriptionId }
  }
  subscribeToActionInfos(
    params: DtoWithoutEnums<SubscribeToActionInfosParamsDto>,
    handler?: (data: SubscribeToActionInfosDataItemDto[]) => void
  ): SubscriptionIdWrapDto {
    const subscriptionId = this.getUniqueSubscriptionId()
    this.addSubscriptionBlock({
      subscriptionId: subscriptionId,
      type: 'ACTION_INFOS',
      params: params,
      handler: handler
    })
    return { subscriptionId: subscriptionId }
  }
  subscribeToEvents(
    params: DtoWithoutEnums<SubscribeToEventsParamsDto>,
    handler?: (data: SubscribeToEventsDataItemDto[]) => void
  ): SubscriptionIdWrapDto {
    const subscriptionId = this.getUniqueSubscriptionId()
    this.addSubscriptionBlock({
      subscriptionId: subscriptionId,
      type: 'EVENTS',
      params: params,
      handler: handler
    })
    return { subscriptionId: subscriptionId }
  }
  unsubscribe(subscriptionId: number) {
    // console.log(`UNSUBSCRIBE: ${subscriptionId}`)
    this.subscriptionBlockForSubscriptionId.delete(subscriptionId)
    const serverSubscriptionId =
      this.serverSubscriptionIdForSubscriptionId.get(subscriptionId)
    this.serverSubscriptionIdForSubscriptionId.delete(subscriptionId)
    if (serverSubscriptionId !== undefined) {
      this.subscriptionIdForServerSubscriptionId.delete(serverSubscriptionId)
      if (this.socket !== null) {
        const params: UnsubscribeOneParamsDto = {
          subscriptionId: serverSubscriptionId
        }
        this.socket
          .emitWithAck(WEB_SOCKET_CONFIG.MESSAGE_TYPE.UNSUBSCRIBE_ONE, params)
          .then(() => {
            // console.log('WS: UNSUBSCRIBE:', serverSubscriptionId)
          })
          .catch(() => {
            //
          })
      }
    }
  }
  unsubscribeMany(subscriptionIds: number[]) {
    // console.log(`UNSUBSCRIBE MANY: ${subscriptionIds.toString()}`)
    const serverSubscriptionIds: number[] = []
    for (const subscriptionId of subscriptionIds) {
      this.subscriptionBlockForSubscriptionId.delete(subscriptionId)
      const serverSubscriptionId =
        this.serverSubscriptionIdForSubscriptionId.get(subscriptionId)
      this.serverSubscriptionIdForSubscriptionId.delete(subscriptionId)
      if (serverSubscriptionId !== undefined) {
        serverSubscriptionIds.push(serverSubscriptionId)
        this.subscriptionIdForServerSubscriptionId.delete(serverSubscriptionId)
      }
    }
    if (this.socket !== null) {
      const params: UnsubscribeManyParamsDto = {
        subscriptionIds: serverSubscriptionIds
      }
      this.socket
        .emitWithAck(WEB_SOCKET_CONFIG.MESSAGE_TYPE.UNSUBSCRIBE_MANY, params)
        .then(() => {
          // console.log('WS: UNSUBSCRIBE:', serverSubscriptionIds)
        })
        .catch(() => {
          //
        })
    }
  }
  unsubscribeAll() {
    // console.log('UNSUBSCRIBE ALL')
    this.subscriptionBlockForSubscriptionId.clear()
    this.serverSubscriptionIdForSubscriptionId.clear()
    this.subscriptionIdForServerSubscriptionId.clear()
    this.inactiveSubscriptionIds.clear()
    if (this.socket !== null) {
      this.socket
        .emitWithAck(WEB_SOCKET_CONFIG.MESSAGE_TYPE.UNSUBSCRIBE_ALL)
        .then(() => {
          // console.log('WS: UNSUBSCRIBE ALL')
        })
        .catch(() => {
          //
        })
    }
  }
  private addSubscriptionBlock(block: SubscriptionBlock) {
    this.subscriptionBlockForSubscriptionId.set(block.subscriptionId, block)
    this.inactiveSubscriptionIds.enqueue(block.subscriptionId)
    // console.log(`SUBSCRIBE: ${block.subscriptionId}`)
    void this.activateSubscriptions()
  }
  private async activateSubscriptions(): Promise<void> {
    while (this.inactiveSubscriptionIds.size > 0) {
      if (this.socket !== null && this.socket.active) {
        const subscriptionId = this.inactiveSubscriptionIds.dequeue()!
        if (
          this.subscriptionBlockForSubscriptionId.has(subscriptionId) === false
        ) {
          continue
        }
        const block =
          this.subscriptionBlockForSubscriptionId.get(subscriptionId)!
        const messageType = {
          SELF_META: WEB_SOCKET_CONFIG.MESSAGE_TYPE.SUBSCRIBE_TO_SELF_META,
          RESOURCE: WEB_SOCKET_CONFIG.MESSAGE_TYPE.SUBSCRIBE_TO_RESOURCE,
          RESOURCES: WEB_SOCKET_CONFIG.MESSAGE_TYPE.SUBSCRIBE_TO_RESOURCES,
          ACTION_INFOS:
            WEB_SOCKET_CONFIG.MESSAGE_TYPE.SUBSCRIBE_TO_ACTION_INFOS,
          EVENTS: WEB_SOCKET_CONFIG.MESSAGE_TYPE.SUBSCRIBE_TO_EVENTS
        }[block.type]
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const response: SubscriptionIdNullWrapDto =
            await this.socket.emitWithAck(messageType, block.params)
          // console.log('WS: SUBSCRIBE:', response)
          const serverSubscriptionId = response.subscriptionId
          if (
            serverSubscriptionId !== null &&
            this.subscriptionBlockForSubscriptionId.has(subscriptionId)
          ) {
            this.serverSubscriptionIdForSubscriptionId.set(
              subscriptionId,
              serverSubscriptionId
            )
            this.subscriptionIdForServerSubscriptionId.set(
              serverSubscriptionId,
              subscriptionId
            )
          } else {
            this.inactiveSubscriptionIds.enqueue(subscriptionId)
            if (serverSubscriptionId !== null) {
              const params: UnsubscribeOneParamsDto = {
                subscriptionId: serverSubscriptionId
              }
              try {
                await this.socket.emitWithAck(
                  WEB_SOCKET_CONFIG.MESSAGE_TYPE.UNSUBSCRIBE_ONE,
                  params
                )
                // console.log('WS: UNSUBSCRIBE:', serverSubscriptionId)
              } catch {
                //
              }
            }
            break
          }
        } catch {
          this.inactiveSubscriptionIds.enqueue(subscriptionId)
          break
        }
      } else {
        break
      }
    }
    if (this.inactiveSubscriptionIds.size > 0) {
      if (this.activateSubscriptionsPlanId !== null) {
        clearTimeout(this.activateSubscriptionsPlanId)
      }
      this.activateSubscriptionsPlanId = setTimeout(() => {
        void this.activateSubscriptions()
      }, WEB_SOCKET_RESUBSCRIBE_DELAY)
    }
  }
  private getUniqueSubscriptionId() {
    this.lastUsedSubscriptionId += 1
    return this.lastUsedSubscriptionId
  }
  // Auxiliary
  private getObject<Response extends object>(
    path: string,
    params?: object,
    withAuthentication: boolean = true,
    withReauthenticateAttempt: boolean = true
  ): Promise<Response> {
    return this.makeRequestWithObjectResponse<Response>(
      'GET',
      path,
      params,
      undefined,
      withAuthentication,
      withReauthenticateAttempt
    )
  }
  private postForObject<Response extends object>(
    path: string,
    body?: object,
    withAuthentication: boolean = true,
    withReauthenticateAttempt: boolean = true
  ): Promise<Response> {
    return this.makeRequestWithObjectResponse<Response>(
      'POST',
      path,
      undefined,
      body,
      withAuthentication,
      withReauthenticateAttempt
    )
  }
  private postMultipartFormForObject<Response extends object>(
    path: string,
    form: Map<string, MultipartFormVal>,
    withAuthentication: boolean = true,
    withReauthenticateAttempt: boolean = true
  ): Promise<Response> {
    const formData = new FormData()
    form.forEach((val, key) => {
      if (val instanceof Array && val.every((item) => item instanceof File)) {
        val.forEach((file) => {
          formData.append(key, file)
        })
      } else {
        formData.append(key, val instanceof File ? val : JSON.stringify(val))
      }
    })
    return this.makeRequestWithObjectResponse<Response>(
      'POST',
      path,
      undefined,
      formData,
      withAuthentication,
      withReauthenticateAttempt
    )
  }
  private async getBlob(
    path: string,
    params?: object,
    withAuthentication: boolean = true,
    withReauthenticateAttempt: boolean = true
  ): Promise<Blob> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await this.makeRequest({
      method: 'GET',
      path,
      params,
      body: undefined,
      responseType: 'blob',
      withAuthentication,
      withReauthenticateAttempt
    })
    if (data instanceof Blob === false) {
      const message = 'Unsuccessful converting server response to Blob'
      log(
        [
          `Invalid server response for GET-request with path "${path}": ${message}`
        ],
        'importantError'
      )
      throw new ServerConnectorError(undefined, message)
    } else {
      return data
    }
  }
  private async makeRequestWithObjectResponse<Response extends object>(
    method: 'GET' | 'POST',
    path: string,
    params: object | undefined,
    body: object | undefined,
    withAuthentication: boolean = true,
    withReauthenticateAttempt: boolean = true
  ): Promise<Response> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = await this.makeRequest({
      method,
      path,
      params,
      body,
      responseType: 'json',
      withAuthentication,
      withReauthenticateAttempt
    })
    if (response instanceof Object) {
      return response as Response
    } else {
      log(
        [
          `Invalid server response for ${method}-request with path "${path}": no object. Response:`
        ],
        'importantError'
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      logWithoutTime([response], 'error')
      throw new ServerConnectorError(
        undefined,
        'Invalid server response: no object',
        undefined
      )
    }
  }
  private async makeRequest(config: {
    method: 'GET' | 'POST'
    path: string
    params: object | undefined
    body: object | undefined
    responseType: 'json' | 'blob'
    withAuthentication: boolean
    withReauthenticateAttempt: boolean
  }): Promise<any> {
    const {
      method,
      path,
      params,
      body,
      responseType,
      withAuthentication,
      withReauthenticateAttempt
    } = config
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    let response: AxiosResponse<any, any, {}>
    try {
      response = await axios({
        headers:
          withAuthentication && this.credentials !== null
            ? { Authorization: `Bearer ${this.credentials.accessToken}` }
            : undefined,
        method: method === 'GET' ? 'get' : 'post',
        baseURL: this.host,
        url: PATH_PREFIX + path,
        params: params,
        data: body,
        responseType: responseType,
        validateStatus: function () {
          return true
        }
      })
    } catch /*(error)*/ {
      // const errorData = error instanceof Object ? error : undefined
      log(
        [
          `Unsuccessful server ${method}-request with path "${path}".${/** errorData ? ' Error:' : */ ''}`
        ],
        'importantError'
      )
      this.meta = {
        status: 'NOT_CONNECTED'
      }
      // if (errorData) {
      //   logWithoutTime([errorData], 'error')
      // }
      throw new ServerConnectorError(
        undefined,
        'Unsuccessful server request',
        undefined
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = response.data
    if (response.status < 200 || response.status >= 300) {
      const errorData =
        responseType === 'json' && data instanceof Object
          ? (data as object)
          : undefined
      log(
        [
          `Unsuccessful server ${method}-request with path "${path}" with response status ${response.status} ("${response.statusText}")${errorData ? ' and following object:' : ''}`
        ],
        'importantError'
      )
      if (errorData) {
        logWithoutTime([errorData], 'error')
      }
      if (response.status === SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED) {
        if (this.meta.status !== 'NOT_SETUP') {
          this.meta = {
            status: 'NOT_AUTHENTICATED'
          }
        }
      }
      if (
        response.status === SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED &&
        withReauthenticateAttempt
      ) {
        await this.authenticate()
        return this.makeRequest({
          method,
          path,
          params,
          body,
          responseType,
          withAuthentication,
          withReauthenticateAttempt: false
        })
      }
      switch (response.status) {
        case SERVER_CONNECTOR_ERROR_STATUS.BAD_REQUEST:
          throw new ServerConnectorBadRequestError(undefined, errorData)
        case SERVER_CONNECTOR_ERROR_STATUS.CONFLICT:
          throw new ServerConnectorConflictError()
        case SERVER_CONNECTOR_ERROR_STATUS.FORBIDDEN:
          throw new ServerConnectorForbiddenError()
        case SERVER_CONNECTOR_ERROR_STATUS.ISE:
          throw new ServerConnectorIseError()
        case SERVER_CONNECTOR_ERROR_STATUS.NOT_FOUND:
          throw new ServerConnectorNotFoundError()
        case SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED:
          throw new ServerConnectorUnauthorizedError()
        default:
          throw new ServerConnectorError(
            response.status,
            response.statusText,
            errorData
          )
      }
    }
    if (
      withAuthentication &&
      this.credentials !== null &&
      this.meta.status !== 'AUTHENTICATED'
    ) {
      this.meta = {
        status: 'AUTHENTICATED',
        selfMeta: {
          id: this.credentials.userId,
          login: this.credentials.login,
          rights: this.credentials.rights
        }
      }
    }
    if (responseType === 'json') {
      this.prepareResponseObject(data)
    }
    return data
  }
  private prepareResponseObject(obj: any) {
    /* eslint-disable */
    const specialObjects = [Date]
    function process(obj: any): void {
      if (
        specialObjects.some((SpecialObject) => obj instanceof SpecialObject)
      ) {
        return
      } else if (obj instanceof Array) {
        obj.map((item) => process(item))
      } else if (obj instanceof Object) {
        for (const key of Object.keys(obj)) {
          if (
            (key === 'date' || key.endsWith('time') || key.endsWith('Time')) &&
            typeof obj[key] === 'string'
          ) {
            obj[key] = new Date(obj[key])
          } else {
            process(obj[key])
          }
        }
      }
    }
    return process(obj)
    /* eslint-enable */
  }
  // Old version with validation
  // private getObject<Response extends object>(
  //   ResponseClassConstructor: ClassConstructor<Response>,
  //   path: string,
  //   params: object | undefined
  // ): Promise<Response> {
  //   return this.makeRequestWithObjectResponse<Response>(
  //     ResponseClassConstructor,
  //     'GET',
  //     path,
  //     params,
  //     undefined
  //   )
  // }
  // private postForObject<Response extends object>(
  //   ResponseClassConstructor: ClassConstructor<Response>,
  //   path: string,
  //   body?: object
  // ): Promise<Response> {
  //   return this.makeRequestWithObjectResponse<Response>(
  //     ResponseClassConstructor,
  //     'POST',
  //     path,
  //     undefined,
  //     body
  //   )
  // }
  // private postMultipartFormForObject<Response extends object>(
  //   ResponseClassConstructor: ClassConstructor<Response>,
  //   path: string,
  //   form: Map<string, object | File>
  // ): Promise<Response> {
  //   const formData = new FormData()
  //   form.forEach((val, key) => {
  //     formData.append(key, val instanceof File ? val : JSON.stringify(val))
  //   })
  //   return this.makeRequestWithObjectResponse<Response>(
  //     ResponseClassConstructor,
  //     'POST',
  //     path,
  //     undefined,
  //     formData
  //   )
  // }
  // private async getBlob(path: string, params?: object): Promise<Blob> {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //   const data = await this.makeRequest('GET', path, params, undefined, 'blob')
  //   if (data instanceof Blob === false) {
  //     const message = 'Unsuccessful converting server response to Blob'
  //     log(
  //       [
  //         `Invalid server response for GET-request with path "${path}": ${message}`
  //       ],
  //       'importantError'
  //     )
  //     throw new ServerConnectorError(undefined, message)
  //   } else {
  //     return data
  //   }
  // }
  // private async makeRequestWithObjectResponse<Response extends object>(
  //   ResponseClassConstructor: ClassConstructor<Response>,
  //   method: 'GET' | 'POST',
  //   path: string,
  //   params: object | undefined,
  //   body: object | undefined
  // ): Promise<Response> {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //   const response = await this.makeRequest(method, path, params, body, 'json')
  //   try {
  //     const instance = plainToClass(ResponseClassConstructor, response)
  //     await validateOrReject(instance)
  //     return response as Response
  //   } catch (error) {
  //     log(
  //       [
  //         `Invalid server response for ${method}-request with path "${path}". Response:`
  //       ],
  //       'importantError'
  //     )
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  //     logWithoutTime([response], 'error')
  //     if (error instanceof Object) {
  //       logWithoutTime(['Error:'], 'error')
  //       logWithoutTime([error], 'error')
  //     }
  //     throw new ServerConnectorError(
  //       undefined,
  //       'Invalid server response object',
  //       error instanceof Object ? error : undefined
  //     )
  //   }
  // }
  // private async makeRequest(
  //   method: 'GET' | 'POST',
  //   path: string,
  //   params: object | undefined,
  //   body: object | undefined,
  //   responseType: 'json' | 'blob'
  // ): Promise<any> {
  //   // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  //   let response: AxiosResponse<any, any, {}>
  //   try {
  //     response = await axios({
  //       headers:
  //         this.accessToken !== null
  //           ? { Authorization: `Bearer ${this.accessToken}` }
  //           : undefined,
  //       method: method === 'GET' ? 'get' : 'post',
  //       baseURL: this.host,
  //       url: PATH_PREFIX + path,
  //       params: params,
  //       data: body,
  //       responseType: responseType,
  //       validateStatus: function () {
  //         return true
  //       }
  //     })
  //   } catch (error) {
  //     const errorData = error instanceof Object ? error : undefined
  //     log(
  //       [
  //         `Unsuccessful server ${method}-request with path "${path}".${errorData ? ' Error:' : ''}`
  //       ],
  //       'importantError'
  //     )
  //     if (errorData) {
  //       logWithoutTime([errorData], 'error')
  //     }
  //     throw new ServerConnectorError(
  //       undefined,
  //       'Unsuccessful server request',
  //       errorData
  //     )
  //   }
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //   const data = response.data
  //   if (response.status < 200 || response.status >= 300) {
  //     const errorData = data instanceof Object ? (data as object) : undefined
  //     log(
  //       [
  //         `Unsuccessful server ${method}-request with path "${path}" with response status ${response.status} ("${response.statusText}")${errorData ? ' and following object:' : ''}`
  //       ],
  //       'importantError'
  //     )
  //     if (errorData) {
  //       logWithoutTime([errorData], 'error')
  //     }
  //     if (
  //       response.status ===
  //       (SERVER_CONNECTOR_ERROR_STATUS.UNAUTHORIZED)
  //     ) {
  //       const accessToken = (await this.delegate.getAccessTokenData())?.token
  //       if (accessToken !== undefined && accessToken !== this.accessToken) {
  //         this.accessToken = accessToken
  //         return this.makeRequest(method, path, params, body, responseType)
  //       }
  //     }
  //     throw new ServerConnectorError(
  //       response.status,
  //       response.statusText,
  //       errorData
  //     )
  //   }

  //   return data
  // }
}

const CREDENTIALS_KEY = 'CREDENTIALS'
// const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN'
// const REFRESH_TOKEN_EXPIRATION_TIME_KEY = 'REFRESH_TOKEN_EXPIRATION_TIME'
// const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN'
// const ACCESS_TOKEN_EXPIRATION_TIME_KEY = 'ACCESS_TOKEN_EXPIRATION_TIME'

class ServerConnectorDelegateImpl implements ServerConnectorDelegate {
  // TODO: check the security of this token storage technique
  getCredentials(): ServerConnectorCredentials | null {
    /* eslint-disable */
    const credentialsSerialized = localStorage.getItem(CREDENTIALS_KEY)
    if (credentialsSerialized !== null) {
      const result = JSON.parse(credentialsSerialized)
      result.accessTokenExpirationTime = new Date(
        result.accessTokenExpirationTime
      )
      result.refreshTokenExpirationTime = new Date(
        result.refreshTokenExpirationTime
      )
      return result as ServerConnectorCredentials
    } else {
      return null
    }
    /* eslint-enable */
  }
  setCredentials(credentials: ServerConnectorCredentials): void {
    localStorage.setItem(
      CREDENTIALS_KEY,
      JSON.stringify({
        ...credentials,
        accessTokenExpirationTime:
          credentials.accessTokenExpirationTime.toString(),
        refreshTokenExpirationTime:
          credentials.refreshTokenExpirationTime.toString()
      })
    )
  }
  deleteCredentials(): void {
    localStorage.removeItem(CREDENTIALS_KEY)
  }
  // getRefreshTokenData(): {
  //   token: string
  //   expirationTime: Date
  // } | null {
  //   const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  //   const refreshTokenExpirationTimeStr = localStorage.getItem(
  //     REFRESH_TOKEN_EXPIRATION_TIME_KEY
  //   )
  //   return refreshToken !== null
  //     ? {
  //         token: refreshToken,
  //         expirationTime: new Date(refreshTokenExpirationTimeStr!)
  //       }
  //     : null
  // }
  // setRefreshTokenData(token: string, expirationTime: Date): void {
  //   localStorage.setItem(REFRESH_TOKEN_KEY, token)
  //   localStorage.setItem(
  //     REFRESH_TOKEN_EXPIRATION_TIME_KEY,
  //     expirationTime.toString()
  //   )
  // }
  // deleteRefreshTokenData(): void {
  //   localStorage.removeItem(REFRESH_TOKEN_KEY)
  //   localStorage.removeItem(REFRESH_TOKEN_EXPIRATION_TIME_KEY)
  // }
  // getAccessTokenData(): {
  //   token: string
  //   expirationTime: Date
  // } | null {
  //   const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  //   const accessTokenExpirationTimeStr = localStorage.getItem(
  //     ACCESS_TOKEN_EXPIRATION_TIME_KEY
  //   )
  //   return accessToken !== null
  //     ? {
  //         token: accessToken,
  //         expirationTime: new Date(accessTokenExpirationTimeStr!)
  //       }
  //     : null
  // }
  // setAccessTokenData(token: string, expirationTime: Date): void {
  //   localStorage.setItem(ACCESS_TOKEN_KEY, token)
  //   localStorage.setItem(
  //     ACCESS_TOKEN_EXPIRATION_TIME_KEY,
  //     expirationTime.toString()
  //   )
  // }
  // deleteAccessTokenData(): void {
  //   localStorage.removeItem(ACCESS_TOKEN_KEY)
  //   localStorage.removeItem(ACCESS_TOKEN_EXPIRATION_TIME_KEY)
  // }
}

export const serverConnector = new ServerConnector(
  new ServerConnectorDelegateImpl(),
  HOST
)
