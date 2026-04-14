// Project
import { RightEnum, allRights, type Right } from '@common/enums'
import { ProjButton } from '~/components/buttons/button'
import { localizationForRight } from '~/localization'
// React
import * as React from 'react'
// Material UI
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ButtonBase from '@mui/material/ButtonBase'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface RoleRightGroup {
  id: string
  title: string
  description: string
  rights: Right[]
}

const BASE_ROLE_RIGHT_GROUPS: RoleRightGroup[] = [
  {
    id: 'administration',
    title: 'Администрирование',
    description: 'система, роли и пользователи',
    rights: [
      RightEnum.CLEAR_ALL,
      RightEnum.READ_LOGS,
      RightEnum.READ_ACTION,
      RightEnum.READ_EVENT,
      RightEnum.CREATE_ROLE,
      RightEnum.READ_ROLE,
      RightEnum.UPDATE_ROLE,
      RightEnum.DELETE_ROLE,
      RightEnum.CREATE_USER,
      RightEnum.READ_USER,
      RightEnum.READ_SELF,
      RightEnum.READ_USER_CREDENTIALS,
      RightEnum.UPDATE_USER,
      RightEnum.UPDATE_SELF,
      RightEnum.UPDATE_USER_PASS,
      RightEnum.UPDATE_SELF_PASS,
      RightEnum.DELETE_USER,
      RightEnum.DELETE_SELF
    ]
  },
  {
    id: 'specification',
    title: 'Спецификация',
    description: 'теги, документы, фрагменты, требования и покрытия',
    rights: [
      RightEnum.CREATE_TAG,
      RightEnum.READ_TAG,
      RightEnum.UPDATE_TAG,
      RightEnum.DELETE_TAG,
      RightEnum.CREATE_DOCUMENT,
      RightEnum.READ_DOCUMENT,
      RightEnum.UPDATE_DOCUMENT,
      RightEnum.DELETE_DOCUMENT,
      RightEnum.CREATE_FRAGMENT,
      RightEnum.READ_FRAGMENT,
      RightEnum.UPDATE_FRAGMENT,
      RightEnum.DELETE_FRAGMENT,
      RightEnum.CREATE_REQUIREMENT,
      RightEnum.READ_REQUIREMENT,
      RightEnum.UPDATE_REQUIREMENT,
      RightEnum.DELETE_REQUIREMENT,
      RightEnum.CREATE_COVERAGE,
      RightEnum.READ_COVERAGE,
      RightEnum.UPDATE_COVERAGE,
      RightEnum.DELETE_COVERAGE
    ]
  },
  {
    id: 'topologies',
    title: 'Топологии и форматы',
    description:
      'общие топологии, топологии, дополнительные форматы и базовые конфигурации',
    rights: [
      RightEnum.CREATE_COMMON_TOPOLOGY,
      RightEnum.READ_COMMON_TOPOLOGY,
      RightEnum.UPDATE_COMMON_TOPOLOGY,
      RightEnum.DELETE_COMMON_TOPOLOGY,
      RightEnum.CREATE_TOPOLOGY,
      RightEnum.READ_TOPOLOGY,
      RightEnum.UPDATE_TOPOLOGY,
      RightEnum.DELETE_TOPOLOGY,
      RightEnum.CREATE_DSEF,
      RightEnum.READ_DSEF,
      RightEnum.UPDATE_DSEF,
      RightEnum.DELETE_DSEF,
      RightEnum.CREATE_DBC,
      RightEnum.READ_DBC,
      RightEnum.UPDATE_DBC,
      RightEnum.DELETE_DBC
    ]
  },
  {
    id: 'tests',
    title: 'Тесты',
    description: 'шаблоны тестов, тесты и их выполнение',
    rights: [
      RightEnum.CREATE_TEST_TEMPLATE,
      RightEnum.READ_TEST_TEMPLATE,
      RightEnum.UPDATE_TEST_TEMPLATE,
      RightEnum.DELETE_TEST_TEMPLATE,
      RightEnum.CREATE_TEST,
      RightEnum.READ_TEST,
      RightEnum.UPDATE_TEST,
      RightEnum.DELETE_TEST,
      RightEnum.READ_TEST_TO_EXECUTE,
      RightEnum.LAUNCH_TEST,
      RightEnum.FINISH_TEST
    ]
  },
  {
    id: 'structure',
    title: 'Группы и подгруппы',
    description: 'структура тестового дерева',
    rights: [
      RightEnum.CREATE_SUBGROUP,
      RightEnum.READ_SUBGROUP,
      RightEnum.UPDATE_SUBGROUP,
      RightEnum.DELETE_SUBGROUP,
      RightEnum.CREATE_GROUP,
      RightEnum.READ_GROUP,
      RightEnum.UPDATE_GROUP,
      RightEnum.DELETE_GROUP
    ]
  },
  {
    id: 'execution',
    title: 'Задания и исполнение',
    description: 'устройства, задания, шаблоны заданий и срезы',
    rights: [
      RightEnum.CREATE_DEVICE,
      RightEnum.READ_DEVICE,
      RightEnum.UPDATE_DEVICE,
      RightEnum.DELETE_DEVICE,
      RightEnum.CREATE_TASK,
      RightEnum.READ_TASK,
      RightEnum.CANCEL_TASK,
      RightEnum.ABORT_TASK,
      RightEnum.PAUSE_TASK,
      RightEnum.UNPAUSE_TASK,
      RightEnum.UPDATE_TASK,
      RightEnum.DELETE_TASK,
      RightEnum.CREATE_TASK_TEMPLATE,
      RightEnum.READ_TASK_TEMPLATE,
      RightEnum.UPDATE_TASK_TEMPLATE,
      RightEnum.DELETE_TASK_TEMPLATE,
      RightEnum.CREATE_SLICE,
      RightEnum.READ_SLICE,
      RightEnum.UPDATE_SLICE,
      RightEnum.DELETE_SLICE
    ]
  },
  {
    id: 'reports',
    title: 'Отчёты',
    description: 'отчеты о выполнении тестов, групп, подгрупп и заданий',
    rights: [
      RightEnum.CREATE_TEST_REPORT_MESSAGE,
      RightEnum.CREATE_TEST_REPORT_ITEM,
      RightEnum.DELETE_TEST_REPORT_ITEM,
      RightEnum.READ_TEST_REPORT,
      RightEnum.READ_SUBGROUP_REPORT,
      RightEnum.READ_GROUP_REPORT,
      RightEnum.READ_TASK_REPORT
    ]
  }
]

const groupedRightsSet = new Set(
  BASE_ROLE_RIGHT_GROUPS.flatMap((group) => group.rights)
)

const ROLE_RIGHT_GROUPS: RoleRightGroup[] = [
  ...BASE_ROLE_RIGHT_GROUPS,
  ...(groupedRightsSet.size < allRights.length
    ? [
        {
          id: 'other',
          title: 'Прочее',
          description: 'права, которые не попали в основные группы',
          rights: allRights.filter(
            (right) => groupedRightsSet.has(right) === false
          )
        }
      ]
    : [])
]

export interface RoleRightQuickGroupsProps {
  selectedRights: Right[]
  onAddRights: (rights: Right[]) => void
  onToggleRight: (right: Right) => void
}

export function RoleRightQuickGroups(props: RoleRightQuickGroupsProps) {
  const selectedRightsSet = React.useMemo(
    () => new Set(props.selectedRights),
    [props.selectedRights]
  )
  const [expandedGroupId, setExpandedGroupId] = React.useState<string | false>(
    false
  )

  return (
    <Stack spacing={1} sx={{ px: 1, pt: 0.5 }}>
      <Typography color="textSecondary" fontSize="0.85rem">
        Быстрое добавление по группам доступно ниже. Откройте нужный раздел,
        добавьте весь набор, а справа быстро скорректируйте отдельные права по
        клику.
      </Typography>
      <Stack spacing={1}>
        {ROLE_RIGHT_GROUPS.map((group) => {
          const selectedCount = group.rights.filter((right) =>
            selectedRightsSet.has(right)
          ).length
          const groupIsFullySelected = selectedCount === group.rights.length

          return (
            <Accordion
              key={group.id}
              expanded={expandedGroupId === group.id}
              onChange={(_, isExpanded) => {
                setExpandedGroupId(isExpanded ? group.id : false)
              }}
              sx={{
                border: (theme) => `2px solid ${theme.palette.divider}`,
                borderRadius: 1.25,
                '&:not(:last-of-type)': {
                  borderBottom: (theme) => `2px solid ${theme.palette.divider}`
                },
                '&.Mui-expanded': {
                  margin: 0
                }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ width: '100%', pr: 1 }}
                >
                  <Typography sx={{ fontWeight: 700 }}>
                    {group.title}
                  </Typography>
                  <Typography color="textSecondary" fontSize="0.8rem">
                    Выбрано {selectedCount} из {group.rights.length}
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  alignItems={{ xs: 'stretch', md: 'flex-start' }}
                >
                  <Stack spacing={1.25} sx={{ width: { xs: '100%', md: 260 } }}>
                    <Typography color="textSecondary" fontSize="0.82rem">
                      {group.description}
                    </Typography>
                    <ProjButton
                      variant="outlined"
                      disabled={groupIsFullySelected}
                      sx={{ alignSelf: 'flex-start' }}
                      onClick={() => {
                        props.onAddRights(group.rights)
                      }}
                    >
                      {groupIsFullySelected ? 'уже добавлено' : 'добавить все'}
                    </ProjButton>
                  </Stack>
                  <Stack
                    spacing={0}
                    sx={{
                      flex: 1,
                      minWidth: 0,
                      maxHeight: 128,
                      overflow: 'auto',
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      borderRadius: 1
                    }}
                  >
                    {group.rights.map((right, index) => {
                      const rightIsSelected = selectedRightsSet.has(right)

                      return (
                        <React.Fragment key={right}>
                          {index > 0 ? <Divider /> : null}
                          <ButtonBase
                            onClick={() => {
                              props.onToggleRight(right)
                            }}
                            sx={{
                              width: '100%',
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              px: 1.25,
                              py: 0.7,
                              bgcolor: rightIsSelected
                                ? 'action.selected'
                                : 'transparent',
                              '&:hover': {
                                bgcolor: rightIsSelected
                                  ? 'action.selected'
                                  : 'action.hover'
                              }
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                            >
                              {rightIsSelected ? (
                                <CheckCircleIcon
                                  color="success"
                                  sx={{ fontSize: '1rem', flexShrink: 0 }}
                                />
                              ) : (
                                <CloseIcon
                                  color="error"
                                  sx={{ fontSize: '1rem', flexShrink: 0 }}
                                />
                              )}
                              <Typography fontSize="0.84rem">
                                {localizationForRight.get(right) ?? right}
                              </Typography>
                            </Stack>
                          </ButtonBase>
                        </React.Fragment>
                      )
                    })}
                  </Stack>
                </Stack>
              </AccordionDetails>
            </Accordion>
          )
        })}
      </Stack>
    </Stack>
  )
}
