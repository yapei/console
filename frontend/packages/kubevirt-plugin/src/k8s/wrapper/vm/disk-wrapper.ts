import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { DiskType, DiskBus } from '../../../constants/vm/storage';

type CombinedTypeData = {
  bus?: string;
};

export class DiskWrapper extends ObjectWithTypePropertyWrapper<
  V1Disk,
  DiskType,
  CombinedTypeData,
  DiskWrapper
> {
  static initializeFromSimpleData = ({
    name,
    type,
    bus,
    bootOrder,
  }: {
    name?: string;
    type?: DiskType;
    bus?: DiskBus;
    bootOrder?: number;
  }) =>
    new DiskWrapper({
      name,
      bootOrder,
    }).setType(type, { bus: bus?.getValue() });

  constructor(disk?: V1Disk | DiskWrapper, copy = false) {
    super(disk, copy, DiskType);
  }

  getName = () => this.get('name');

  getDiskBus = (): DiskBus => DiskBus.fromString(this.getIn([this.getTypeValue(), 'bus']));

  getReadableDiskBus = () => {
    const diskBus = this.getDiskBus();
    return diskBus && diskBus.toString();
  };

  getBootOrder = () => this.get('bootOrder');

  isFirstBootableDevice = () => this.getBootOrder() === 1;

  hasBootOrder = () => this.getBootOrder() != null;

  protected sanitize(type: DiskType, { bus }: CombinedTypeData) {
    switch (type) {
      case DiskType.FLOPPY:
        return {};
      default:
        return { bus };
    }
  }
}
