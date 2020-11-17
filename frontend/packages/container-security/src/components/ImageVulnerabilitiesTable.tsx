import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { sortable } from '@patternfly/react-table';
import { Table } from '@console/internal/components/factory';
import { MsgBox } from '@console/internal/components/utils';
import ImageVulnerabilityRow, {
  imageVulnerabilitiesTableColumnClasses,
} from './ImageVulnerabilityRow';
import { Feature } from '../types';

type ImageVulnerabilitiesTableProps = {
  features: Feature[];
};

const ImageVulnerabilitiesTable: React.FC<ImageVulnerabilitiesTableProps> = (props) => {
  const { t } = useTranslation();
  const EmptyMsg = () => (
    <MsgBox title={t('container-security~No Image Vulnerabilities Found')} detail="" />
  );
  const ImageVulnerabilitiesTableHeader = () => [
    {
      title: t('container-security~Vulnerability'),
      transforms: [sortable],
      sortField: 'vulnerability.name',
      props: { className: imageVulnerabilitiesTableColumnClasses[0] },
    },
    {
      title: t('container-security~Severity'),
      transforms: [sortable],
      sortField: 'vulnerability.severity',
      props: { className: imageVulnerabilitiesTableColumnClasses[1] },
    },
    {
      title: t('container-security~Package'),
      transforms: [sortable],
      sortField: 'feature.name',
      props: { className: imageVulnerabilitiesTableColumnClasses[2] },
    },
    {
      title: t('container-security~Current Version'),
      transforms: [sortable],
      sortField: 'feature.version',
      props: { className: imageVulnerabilitiesTableColumnClasses[3] },
    },
    {
      title: t('container-security~Fixed in Version'),
      transforms: [sortable],
      sortField: 'vulnerability.fixedby',
      props: { className: imageVulnerabilitiesTableColumnClasses[4] },
    },
  ];
  return (
    <Table
      {...props}
      aria-label={t('container-security~Vulnerabilities')}
      Header={ImageVulnerabilitiesTableHeader}
      Row={ImageVulnerabilityRow}
      EmptyMsg={EmptyMsg}
      virtualize
    />
  );
};

export default ImageVulnerabilitiesTable;
