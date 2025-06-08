import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'DỊCH VỤ ĐA DẠNG',
    Svg: require('@site/static/img/servers.svg').default,
    description: (
      <>
        Dịch vụ đa dạng, cam kết chất lượng, giá hợp lý, hỗ trợ kỹ thuật 24/7.
      </>
    ),
  },
  {
    title: '16+ NĂM KINH NGHIỆM',
    Svg: require('@site/static/img/kinh-nghiem.svg').default,
    description: (
      <>
        Hoạt động mạnh mẽ, uy tín cao trong ngành từ năm 2008 nay.
      </>
    ),
  },
  {
    title: '70+ CHUYÊN GIA',
    Svg: require('@site/static/img/chuyen-gia.svg').default,
    description: (
      <>
        Đội ngũ chuyên gia về hệ thống và mã nguồn mở, giàu kinh nghiệm.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
