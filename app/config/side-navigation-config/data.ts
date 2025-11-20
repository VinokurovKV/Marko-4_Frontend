// Project
import type { SideNavigationConfig } from './common'
// Material UI
// import BarChartIcon from '@mui/icons-material/BarChart'
// import CodeIcon from '@mui/icons-material/Code'
import ComputerIcon from '@mui/icons-material/Computer'
import ConstructionIcon from '@mui/icons-material/Construction'
import DataObjectIcon from '@mui/icons-material/DataObject'
import DescriptionIcon from '@mui/icons-material/Description'
// import DeviceHubIcon from '@mui/icons-material/DeviceHub'
// import ExtensionIcon from '@mui/icons-material/Extension'
import FormatListNumberedRtlIcon from '@mui/icons-material/FormatListNumberedRtl'
import FoundationIcon from '@mui/icons-material/Foundation'
// import GradingIcon from '@mui/icons-material/Grading'
// import GridOnIcon from '@mui/icons-material/GridOn'
// import GroupIcon from '@mui/icons-material/Group'
import GroupsIcon from '@mui/icons-material/Groups'
import HistoryIcon from '@mui/icons-material/History'
import HiveIcon from '@mui/icons-material/Hive'
import LanIcon from '@mui/icons-material/Lan'
// import LayersIcon from '@mui/icons-material/Layers'
// import ManageAccountsIcon from '@mui/icons-material/ManageAccounts'
// import MediationIcon from '@mui/icons-material/Mediation'
import PersonIcon from '@mui/icons-material/Person'
import RuleIcon from '@mui/icons-material/Rule'
// import SchemaIcon from '@mui/icons-material/Schema'
// import SettingsIcon from '@mui/icons-material/Settings'
// import SettingsAccessibilityIcon from '@mui/icons-material/SettingsAccessibility'
import StorageIcon from '@mui/icons-material/Storage'
// import TagIcon from '@mui/icons-material/Tag'
import TaskIcon from '@mui/icons-material/Task'
import TheaterComedyIcon from '@mui/icons-material/TheaterComedy'
// import VerifiedIcon from '@mui/icons-material/Verified'
import WidgetsIcon from '@mui/icons-material/Widgets'

export const SIDE_NAVIGATION_CONFIG: SideNavigationConfig = [
  {
    title: 'общее',
    nested: [
      {
        id: 'events',
        title: 'события',
        Icon: HistoryIcon,
        href: '/events',
        requiredRights: ['READ_EVENT']
      }
    ]
  },
  {
    title: 'тестирование',
    nested: [
      {
        id: 'tasks',
        title: 'задания',
        Icon: TaskIcon,
        href: '/tasks',
        requiredRights: ['READ_TASK']
      },
      {
        id: 'devices',
        title: 'устройства',
        Icon: ComputerIcon,
        href: '/devices',
        requiredRights: ['READ_DEVICE']
      }
    ]
  },
  {
    title: 'тесты',
    nested: [
      {
        id: 'tests',
        title: 'тесты',
        Icon: RuleIcon,
        href: '/tests',
        requiredRights: ['READ_TEST', 'READ_SUBGROUP', 'READ_GROUP']
      },
      {
        id: 'topologies',
        title: 'топологии',
        Icon: LanIcon,
        href: '/topologies',
        requiredRights: ['READ_COMMON_TOPOLOGY', 'READ_TOPOLOGY']
      },
      {
        id: 'coverages',
        title: 'покрытия',
        Icon: HiveIcon,
        href: '/coverages',
        requiredRights: ['READ_COVERAGE']
      },
      {
        id: 'test-utilities',
        title: 'утилиты',
        Icon: ConstructionIcon,
        nested: [
          {
            id: 'dbcs',
            title: 'баз. конфигурации',
            Icon: WidgetsIcon,
            href: '/dbcs',
            requiredRights: ['READ_DBC']
          },
          {
            id: 'test-templates',
            title: 'шаблоны',
            Icon: FoundationIcon,
            href: '/test-templates',
            requiredRights: ['READ_TEST_TEMPLATE']
          },
          {
            id: 'dsefs',
            title: 'доп. форматы',
            Icon: DataObjectIcon,
            href: '/dsefs',
            requiredRights: ['READ_DSEF']
          }
        ]
      }
    ]
  },
  {
    title: 'сетевая функциональность',
    nested: [
      {
        id: 'requirements',
        title: 'требования',
        Icon: FormatListNumberedRtlIcon,
        href: '/requirements',
        requiredRights: ['READ_REQUIREMENT']
      },
      {
        id: 'documents',
        title: 'документы',
        Icon: DescriptionIcon,
        href: '/documents',
        requiredRights: ['READ_DOCUMENT', 'READ_FRAGMENT']
      }
    ]
  },
  // {
  //   title: 'теги',
  //   nested: [
  //     {
  //       id: 'tags',
  //       title: 'теги',
  //       Icon: TagIcon,
  //       href: '/tags',
  //       requiredRights: ['READ_TAG']
  //     }
  //   ]
  // },
  {
    title: 'администрирование',
    nested: [
      {
        id: 'access',
        title: 'доступ',
        Icon: GroupsIcon,
        nested: [
          {
            id: 'users',
            title: 'пользователи',
            Icon: PersonIcon,
            href: '/users',
            requiredRights: ['READ_USER']
          },
          {
            id: 'roles',
            title: 'роли',
            Icon: TheaterComedyIcon,
            href: '/roles',
            requiredRights: ['READ_ROLE']
          }
        ]
      },

      {
        id: 'server',
        title: 'сервер',
        Icon: StorageIcon,
        href: '/server',
        requiredRights: ['READ_LOGS']
      }
    ]
  }
]
