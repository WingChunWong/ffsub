import {
	Button,
	Card,
	CardHeader,
	Input,
	makeStyles,
	Text,
	tokens,
} from "@fluentui/react-components";
import { FolderOpenRegular } from "@fluentui/react-icons";
import { useCallback } from "react";

const useStyles = makeStyles({
	card: {
		width: "100%",
	},
	fileRow: {
		display: "flex",
		alignItems: "center",
		gap: tokens.spacingHorizontalM,
		marginBottom: tokens.spacingVerticalM,
	},
	input: {
		flex: 1,
	},
	infoPanel: {
		padding: tokens.spacingVerticalM,
		borderLeft: `4px solid ${tokens.colorBrandBackground}`,
		backgroundColor: tokens.colorNeutralBackground3,
		borderRadius: tokens.borderRadiusMedium,
	},
	infoRow: {
		display: "flex",
		gap: tokens.spacingHorizontalS,
		marginBottom: tokens.spacingVerticalXS,
	},
});

interface FileSelectorProps {
	title: string;
	path: string;
	onBrowse: () => void;
	placeholder: string;
	infoItems: Array<{ label: string; value: string }>;
}

export function FileSelector({ title, path, onBrowse, placeholder, infoItems }: FileSelectorProps) {
	const styles = useStyles();

	const handleBrowse = useCallback(() => {
		onBrowse();
	}, [onBrowse]);

	return (
		<Card className={styles.card}>
			<CardHeader
				header={
					<Text weight="semibold" size={400}>
						{title}
					</Text>
				}
			/>
			<div className={styles.fileRow}>
				<Input className={styles.input} value={path} placeholder={placeholder} readOnly />
				<Button appearance="subtle" icon={<FolderOpenRegular />} onClick={handleBrowse}>
					浏览
				</Button>
			</div>
			<div className={styles.infoPanel}>
				{infoItems.map((item) => (
					<div key={item.label} className={styles.infoRow}>
						<Text weight="semibold">{item.label}:</Text>
						<Text>{item.value}</Text>
					</div>
				))}
			</div>
		</Card>
	);
}
