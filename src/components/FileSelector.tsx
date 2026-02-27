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
		display: "flex",
		flexWrap: "wrap",
		gap: tokens.spacingHorizontalL,
		padding: tokens.spacingVerticalS,
		paddingLeft: tokens.spacingHorizontalM,
		borderLeft: `3px solid ${tokens.colorBrandBackground}`,
		backgroundColor: tokens.colorNeutralBackground3,
		borderRadius: tokens.borderRadiusMedium,
	},
	infoItem: {
		display: "flex",
		gap: tokens.spacingHorizontalXS,
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
				<Button appearance="subtle" icon={<FolderOpenRegular />} onClick={onBrowse}>
					浏览
				</Button>
			</div>
			{infoItems.length > 0 && (
				<div className={styles.infoPanel}>
					{infoItems.map((item) => (
						<div key={item.label} className={styles.infoItem}>
							<Text size={200} weight="semibold">
								{item.label}:
							</Text>
							<Text size={200}>{item.value}</Text>
						</div>
					))}
				</div>
			)}
		</Card>
	);
}
