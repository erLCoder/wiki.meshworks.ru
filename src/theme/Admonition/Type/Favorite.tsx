import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Translate from '@docusaurus/Translate';
import type {Props} from '@theme/Admonition/Type/Note';
import AdmonitionLayout from '@theme/Admonition/Layout';
import IconNote from '@theme/Admonition/Icon/Note';

const infimaClassName = 'alert alert--favorite';

const defaultProps = {
  icon: <IconNote />, // скрываем через CSS, но сохраняем разметку
  title: (
    <Translate
      id="theme.admonition.favorite"
      description="Label used for custom favorite admonition (:::favorite)">
      favorite
    </Translate>
  ),
};

export default function AdmonitionTypeFavorite(props: Props): ReactNode {
  return (
    <AdmonitionLayout
      {...defaultProps}
      {...props}
      className={clsx(infimaClassName, props.className)}>
      {props.children}
    </AdmonitionLayout>
  );
}
